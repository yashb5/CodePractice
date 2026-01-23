const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const TIMEOUT_MS = 10000; // 10 second timeout (longer for compiled languages)
const MAX_OUTPUT_SIZE = 10000; // 10KB max output

class CodeExecutor {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'code-executor');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    // Check which compilers are available
    this.availableCompilers = this.detectCompilers();
  }

  detectCompilers() {
    const compilers = {
      gcc: false,
      gpp: false,
      java: false,
      csharp: false
    };

    try { execSync('gcc --version', { stdio: 'ignore' }); compilers.gcc = true; } catch (e) {}
    try { execSync('g++ --version', { stdio: 'ignore' }); compilers.gpp = true; } catch (e) {}
    try { execSync('javac -version', { stdio: 'ignore' }); compilers.java = true; } catch (e) {}
    try { execSync('mcs --version', { stdio: 'ignore' }); compilers.csharp = true; } catch (e) {}
    
    return compilers;
  }

  async execute(code, language, testCases, functionName) {
    const results = [];
    let totalRuntime = 0;
    let peakMemory = 0;

    for (const testCase of testCases) {
      const result = await this.runSingleTest(code, language, testCase, functionName);
      results.push(result);
      totalRuntime += result.runtime || 0;
      peakMemory = Math.max(peakMemory, result.memory || 0);

      // Stop on first error for submission
      if (result.status !== 'Passed') {
        break;
      }
    }

    const allPassed = results.every(r => r.status === 'Passed');
    
    return {
      results,
      summary: {
        passed: results.filter(r => r.status === 'Passed').length,
        total: testCases.length,
        allPassed,
        totalRuntime,
        peakMemory,
        status: this.determineOverallStatus(results)
      }
    };
  }

  determineOverallStatus(results) {
    if (results.every(r => r.status === 'Passed')) {
      return 'Accepted';
    }
    
    const lastResult = results[results.length - 1];
    if (lastResult.status === 'Time Limit Exceeded') {
      return 'Time Limit Exceeded';
    }
    if (lastResult.status === 'Runtime Error' || lastResult.status === 'Compilation Error') {
      return 'Runtime Error';
    }
    return 'Wrong Answer';
  }

  async runSingleTest(code, language, testCase, functionName) {
    const fileId = uuidv4();
    const filesToCleanup = [];

    try {
      let result;

      switch (language) {
        case 'javascript':
          result = await this.runJavaScript(fileId, code, testCase, functionName, filesToCleanup);
          break;
        case 'python':
          result = await this.runPython(fileId, code, testCase, functionName, filesToCleanup);
          break;
        case 'java':
          result = await this.runJava(fileId, code, testCase, functionName, filesToCleanup);
          break;
        case 'c':
          result = await this.runC(fileId, code, testCase, functionName, filesToCleanup);
          break;
        case 'cpp':
          result = await this.runCpp(fileId, code, testCase, functionName, filesToCleanup);
          break;
        case 'csharp':
          result = await this.runCSharp(fileId, code, testCase, functionName, filesToCleanup);
          break;
        default:
          return {
            status: 'Runtime Error',
            error: `Unsupported language: ${language}`,
            output: null,
            expected: testCase.expected,
            runtime: 0,
            memory: 0
          };
      }

      return result;
    } catch (error) {
      return {
        status: 'Runtime Error',
        error: error.message,
        output: null,
        expected: testCase.expected,
        runtime: 0,
        memory: 0
      };
    } finally {
      // Cleanup all files
      for (const file of filesToCleanup) {
        try {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        } catch (e) {}
      }
    }
  }

  async runJavaScript(fileId, code, testCase, functionName, filesToCleanup) {
    const filePath = path.join(this.tempDir, `${fileId}.js`);
    filesToCleanup.push(filePath);
    
    const wrappedCode = this.wrapJavaScriptCode(code, testCase, functionName);
    fs.writeFileSync(filePath, wrappedCode);
    
    return await this.executeProcess('node', ['--max-old-space-size=128', filePath], testCase.expected);
  }

  async runPython(fileId, code, testCase, functionName, filesToCleanup) {
    const filePath = path.join(this.tempDir, `${fileId}.py`);
    filesToCleanup.push(filePath);
    
    const wrappedCode = this.wrapPythonCode(code, testCase, functionName);
    fs.writeFileSync(filePath, wrappedCode);
    
    return await this.executeProcess('python3', [filePath], testCase.expected);
  }

  async runJava(fileId, code, testCase, functionName, filesToCleanup) {
    if (!this.availableCompilers.java) {
      return {
        status: 'Runtime Error',
        error: 'Java compiler not available on this system',
        output: null,
        expected: testCase.expected,
        runtime: 0,
        memory: 0
      };
    }

    const className = 'Solution';
    const filePath = path.join(this.tempDir, `${className}.java`);
    const classFile = path.join(this.tempDir, `${className}.class`);
    filesToCleanup.push(filePath, classFile);
    
    const wrappedCode = this.wrapJavaCode(code, testCase, functionName, className);
    fs.writeFileSync(filePath, wrappedCode);
    
    // Compile
    try {
      execSync(`javac "${filePath}"`, { cwd: this.tempDir, timeout: 10000, stdio: 'pipe' });
    } catch (error) {
      return {
        status: 'Compilation Error',
        error: error.stderr?.toString() || error.message,
        output: null,
        expected: testCase.expected,
        runtime: 0,
        memory: 0
      };
    }
    
    return await this.executeProcess('java', ['-cp', this.tempDir, className], testCase.expected);
  }

  async runC(fileId, code, testCase, functionName, filesToCleanup) {
    if (!this.availableCompilers.gcc) {
      return {
        status: 'Runtime Error',
        error: 'GCC compiler not available on this system',
        output: null,
        expected: testCase.expected,
        runtime: 0,
        memory: 0
      };
    }

    const srcPath = path.join(this.tempDir, `${fileId}.c`);
    const binPath = path.join(this.tempDir, fileId);
    filesToCleanup.push(srcPath, binPath);
    
    const wrappedCode = this.wrapCCode(code, testCase, functionName);
    fs.writeFileSync(srcPath, wrappedCode);
    
    // Compile
    try {
      execSync(`gcc -o "${binPath}" "${srcPath}" -lm`, { timeout: 10000, stdio: 'pipe' });
    } catch (error) {
      return {
        status: 'Compilation Error',
        error: error.stderr?.toString() || error.message,
        output: null,
        expected: testCase.expected,
        runtime: 0,
        memory: 0
      };
    }
    
    return await this.executeProcess(binPath, [], testCase.expected);
  }

  async runCpp(fileId, code, testCase, functionName, filesToCleanup) {
    if (!this.availableCompilers.gpp) {
      return {
        status: 'Runtime Error',
        error: 'G++ compiler not available on this system',
        output: null,
        expected: testCase.expected,
        runtime: 0,
        memory: 0
      };
    }

    const srcPath = path.join(this.tempDir, `${fileId}.cpp`);
    const binPath = path.join(this.tempDir, fileId);
    filesToCleanup.push(srcPath, binPath);
    
    const wrappedCode = this.wrapCppCode(code, testCase, functionName);
    fs.writeFileSync(srcPath, wrappedCode);
    
    // Compile
    try {
      execSync(`g++ -o "${binPath}" "${srcPath}" -std=c++17`, { timeout: 10000, stdio: 'pipe' });
    } catch (error) {
      return {
        status: 'Compilation Error',
        error: error.stderr?.toString() || error.message,
        output: null,
        expected: testCase.expected,
        runtime: 0,
        memory: 0
      };
    }
    
    return await this.executeProcess(binPath, [], testCase.expected);
  }

  async runCSharp(fileId, code, testCase, functionName, filesToCleanup) {
    if (!this.availableCompilers.csharp) {
      return {
        status: 'Runtime Error',
        error: 'C# compiler (mcs/mono) not available on this system',
        output: null,
        expected: testCase.expected,
        runtime: 0,
        memory: 0
      };
    }

    const srcPath = path.join(this.tempDir, `${fileId}.cs`);
    const binPath = path.join(this.tempDir, `${fileId}.exe`);
    filesToCleanup.push(srcPath, binPath);
    
    const wrappedCode = this.wrapCSharpCode(code, testCase, functionName);
    fs.writeFileSync(srcPath, wrappedCode);
    
    // Compile
    try {
      execSync(`mcs -out:"${binPath}" "${srcPath}"`, { timeout: 10000, stdio: 'pipe' });
    } catch (error) {
      return {
        status: 'Compilation Error',
        error: error.stderr?.toString() || error.message,
        output: null,
        expected: testCase.expected,
        runtime: 0,
        memory: 0
      };
    }
    
    return await this.executeProcess('mono', [binPath], testCase.expected);
  }

  wrapJavaScriptCode(code, testCase, functionName) {
    const inputArgs = Object.values(testCase.input)
      .map(v => JSON.stringify(v))
      .join(', ');

    return `
${code}

const startTime = process.hrtime.bigint();
const startMemory = process.memoryUsage().heapUsed;

try {
  const result = ${functionName}(${inputArgs});
  const endTime = process.hrtime.bigint();
  const endMemory = process.memoryUsage().heapUsed;
  
  console.log(JSON.stringify({
    success: true,
    result: result,
    runtime: Number(endTime - startTime) / 1000000,
    memory: Math.max(0, (endMemory - startMemory) / 1024)
  }));
} catch (error) {
  console.log(JSON.stringify({
    success: false,
    error: error.message,
    stack: error.stack
  }));
}
`;
  }

  wrapPythonCode(code, testCase, functionName) {
    const inputArgs = Object.values(testCase.input)
      .map(v => JSON.stringify(v))
      .join(', ');

    return `
import json
import time
import traceback
import sys

${code}

start_time = time.perf_counter()

try:
    result = ${functionName}(${inputArgs})
    end_time = time.perf_counter()
    
    print(json.dumps({
        "success": True,
        "result": result,
        "runtime": (end_time - start_time) * 1000,
        "memory": 0
    }))
except Exception as e:
    print(json.dumps({
        "success": False,
        "error": str(e),
        "stack": traceback.format_exc()
    }))
`;
  }

  wrapJavaCode(code, testCase, functionName, className) {
    const inputs = Object.values(testCase.input);
    const inputSetup = this.generateJavaInputs(inputs);
    const functionCall = this.generateJavaFunctionCall(functionName, inputs);

    return `
import java.util.*;

${code}

public class ${className} {
    public static void main(String[] args) {
        try {
            Solution solution = new Solution();
            ${inputSetup}
            
            long startTime = System.nanoTime();
            var result = solution.${functionCall};
            long endTime = System.nanoTime();
            
            String resultJson = toJson(result);
            System.out.println("{\\"success\\": true, \\"result\\": " + resultJson + ", \\"runtime\\": " + ((endTime - startTime) / 1000000.0) + ", \\"memory\\": 0}");
        } catch (Exception e) {
            System.out.println("{\\"success\\": false, \\"error\\": \\"" + e.getMessage().replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") + "\\"}");
        }
    }
    
    static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof Boolean || obj instanceof Number) return obj.toString();
        if (obj instanceof String) return "\\"" + obj.toString().replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") + "\\"";
        if (obj instanceof int[]) {
            int[] arr = (int[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(arr[i]);
            }
            return sb.append("]").toString();
        }
        if (obj instanceof int[][]) {
            int[][] arr = (int[][]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(toJson(arr[i]));
            }
            return sb.append("]").toString();
        }
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(toJson(list.get(i)));
            }
            return sb.append("]").toString();
        }
        return "\\"" + obj.toString() + "\\"";
    }
}
`;
  }

  generateJavaInputs(inputs) {
    return inputs.map((input, i) => {
      if (Array.isArray(input)) {
        if (input.length > 0 && Array.isArray(input[0])) {
          // 2D array
          const rows = input.map(row => `{${row.join(', ')}}`).join(', ');
          return `int[][] input${i} = {${rows}};`;
        }
        return `int[] input${i} = {${input.join(', ')}};`;
      }
      if (typeof input === 'string') {
        return `String input${i} = "${input}";`;
      }
      return `int input${i} = ${input};`;
    }).join('\n            ');
  }

  generateJavaFunctionCall(functionName, inputs) {
    const args = inputs.map((_, i) => `input${i}`).join(', ');
    return `${functionName}(${args})`;
  }

  wrapCCode(code, testCase, functionName) {
    const inputs = Object.values(testCase.input);
    const inputSetup = this.generateCInputs(inputs);
    const functionCall = this.generateCFunctionCall(functionName, inputs);
    const resultPrint = this.generateCResultPrint(testCase.expected);

    return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>

${code}

int main() {
    clock_t start = clock();
    
    ${inputSetup}
    
    ${functionCall}
    
    clock_t end = clock();
    double runtime = ((double)(end - start)) / CLOCKS_PER_SEC * 1000;
    
    ${resultPrint}
    
    return 0;
}
`;
  }

  generateCInputs(inputs) {
    return inputs.map((input, i) => {
      if (Array.isArray(input)) {
        if (input.length > 0 && Array.isArray(input[0])) {
          // 2D array - flatten for simplicity
          const flat = input.flat();
          return `int input${i}_data[] = {${flat.join(', ')}};\n    int input${i}_rows = ${input.length};\n    int input${i}_cols = ${input[0].length};`;
        }
        return `int input${i}[] = {${input.join(', ')}};\n    int input${i}_size = ${input.length};`;
      }
      if (typeof input === 'string') {
        return `char input${i}[] = "${input}";`;
      }
      return `int input${i} = ${input};`;
    }).join('\n    ');
  }

  generateCFunctionCall(functionName, inputs) {
    // This is simplified - real implementation would need type info
    const args = inputs.map((input, i) => {
      if (Array.isArray(input)) {
        return `input${i}, input${i}_size`;
      }
      return `input${i}`;
    }).join(', ');
    return `auto result = ${functionName}(${args});`;
  }

  generateCResultPrint(expected) {
    if (typeof expected === 'boolean') {
      return `printf("{\\"success\\": true, \\"result\\": %s, \\"runtime\\": %f, \\"memory\\": 0}\\n", result ? "true" : "false", runtime);`;
    }
    if (typeof expected === 'number') {
      return `printf("{\\"success\\": true, \\"result\\": %d, \\"runtime\\": %f, \\"memory\\": 0}\\n", result, runtime);`;
    }
    if (typeof expected === 'string') {
      return `printf("{\\"success\\": true, \\"result\\": \\"%s\\", \\"runtime\\": %f, \\"memory\\": 0}\\n", result, runtime);`;
    }
    if (Array.isArray(expected)) {
      return `
    printf("{\\"success\\": true, \\"result\\": [");
    for (int i = 0; i < result_size; i++) {
        if (i > 0) printf(",");
        printf("%d", result[i]);
    }
    printf("], \\"runtime\\": %f, \\"memory\\": 0}\\n", runtime);`;
    }
    return `printf("{\\"success\\": true, \\"result\\": %d, \\"runtime\\": %f, \\"memory\\": 0}\\n", result, runtime);`;
  }

  wrapCppCode(code, testCase, functionName) {
    const inputs = Object.values(testCase.input);
    const inputSetup = this.generateCppInputs(inputs);
    const functionCall = this.generateCppFunctionCall(functionName, inputs);

    return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <chrono>
#include <sstream>

using namespace std;

${code}

template<typename T>
string toJson(const T& val) {
    ostringstream oss;
    oss << val;
    return oss.str();
}

string toJson(bool val) { return val ? "true" : "false"; }
string toJson(const string& val) { return "\\"" + val + "\\""; }

template<typename T>
string toJson(const vector<T>& vec) {
    string result = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) result += ",";
        result += toJson(vec[i]);
    }
    return result + "]";
}

template<typename T>
string toJson(const vector<vector<T>>& vec) {
    string result = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) result += ",";
        result += toJson(vec[i]);
    }
    return result + "]";
}

int main() {
    try {
        Solution solution;
        ${inputSetup}
        
        auto start = chrono::high_resolution_clock::now();
        auto result = solution.${functionCall};
        auto end = chrono::high_resolution_clock::now();
        
        double runtime = chrono::duration<double, milli>(end - start).count();
        
        cout << "{\\"success\\": true, \\"result\\": " << toJson(result) << ", \\"runtime\\": " << runtime << ", \\"memory\\": 0}" << endl;
    } catch (const exception& e) {
        cout << "{\\"success\\": false, \\"error\\": \\"" << e.what() << "\\"}" << endl;
    }
    return 0;
}
`;
  }

  generateCppInputs(inputs) {
    return inputs.map((input, i) => {
      if (Array.isArray(input)) {
        if (input.length > 0 && Array.isArray(input[0])) {
          // 2D array
          const inner = input.map(row => `{${row.join(', ')}}`).join(', ');
          return `vector<vector<int>> input${i} = {${inner}};`;
        }
        return `vector<int> input${i} = {${input.join(', ')}};`;
      }
      if (typeof input === 'string') {
        return `string input${i} = "${input}";`;
      }
      return `int input${i} = ${input};`;
    }).join('\n        ');
  }

  generateCppFunctionCall(functionName, inputs) {
    const args = inputs.map((_, i) => `input${i}`).join(', ');
    return `${functionName}(${args})`;
  }

  wrapCSharpCode(code, testCase, functionName) {
    const inputs = Object.values(testCase.input);
    const inputSetup = this.generateCSharpInputs(inputs);
    const functionCall = this.generateCSharpFunctionCall(functionName, inputs);

    return `
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Diagnostics;

${code}

class Program {
    static void Main() {
        try {
            var solution = new Solution();
            ${inputSetup}
            
            var sw = Stopwatch.StartNew();
            var result = solution.${functionCall};
            sw.Stop();
            
            string resultJson = ToJson(result);
            Console.WriteLine($"{{\\"success\\": true, \\"result\\": {resultJson}, \\"runtime\\": {sw.Elapsed.TotalMilliseconds}, \\"memory\\": 0}}");
        } catch (Exception e) {
            Console.WriteLine($"{{\\"success\\": false, \\"error\\": \\"{e.Message.Replace("\\\\", "\\\\\\\\").Replace("\\"", "\\\\\\"")}\\"}}");
        }
    }
    
    static string ToJson(object obj) {
        if (obj == null) return "null";
        if (obj is bool b) return b ? "true" : "false";
        if (obj is int || obj is long || obj is double) return obj.ToString();
        if (obj is string s) return $"\\"{s}\\"";
        if (obj is int[] arr) return "[" + string.Join(",", arr) + "]";
        if (obj is int[][] arr2d) return "[" + string.Join(",", arr2d.Select(a => "[" + string.Join(",", a) + "]")) + "]";
        if (obj is IList<int> list) return "[" + string.Join(",", list) + "]";
        if (obj is IList<IList<int>> list2d) return "[" + string.Join(",", list2d.Select(l => "[" + string.Join(",", l) + "]")) + "]";
        return $"\\"{obj}\\"";
    }
}
`;
  }

  generateCSharpInputs(inputs) {
    return inputs.map((input, i) => {
      if (Array.isArray(input)) {
        if (input.length > 0 && Array.isArray(input[0])) {
          // 2D array
          const inner = input.map(row => `new int[] {${row.join(', ')}}`).join(', ');
          return `int[][] input${i} = new int[][] {${inner}};`;
        }
        return `int[] input${i} = new int[] {${input.join(', ')}};`;
      }
      if (typeof input === 'string') {
        return `string input${i} = "${input}";`;
      }
      return `int input${i} = ${input};`;
    }).join('\n            ');
  }

  generateCSharpFunctionCall(functionName, inputs) {
    const args = inputs.map((_, i) => `input${i}`).join(', ');
    return `${functionName}(${args})`;
  }

  executeProcess(command, args, expected) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let killed = false;

      const proc = spawn(command, args, {
        timeout: TIMEOUT_MS,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const timeout = setTimeout(() => {
        killed = true;
        proc.kill('SIGKILL');
      }, TIMEOUT_MS);

      proc.stdout.on('data', (data) => {
        if (stdout.length < MAX_OUTPUT_SIZE) {
          stdout += data.toString();
        }
      });

      proc.stderr.on('data', (data) => {
        if (stderr.length < MAX_OUTPUT_SIZE) {
          stderr += data.toString();
        }
      });

      proc.on('close', (code) => {
        clearTimeout(timeout);
        const endTime = Date.now();

        if (killed) {
          resolve({
            status: 'Time Limit Exceeded',
            error: `Execution exceeded ${TIMEOUT_MS}ms`,
            output: null,
            expected,
            runtime: TIMEOUT_MS,
            memory: 0
          });
          return;
        }

        if (stderr && !stdout) {
          resolve({
            status: 'Runtime Error',
            error: stderr.trim(),
            output: null,
            expected,
            runtime: endTime - startTime,
            memory: 0
          });
          return;
        }

        try {
          const output = JSON.parse(stdout.trim());
          
          if (!output.success) {
            resolve({
              status: 'Runtime Error',
              error: output.error,
              output: null,
              expected,
              runtime: output.runtime || 0,
              memory: output.memory || 0
            });
            return;
          }

          const passed = this.compareResults(output.result, expected);
          
          resolve({
            status: passed ? 'Passed' : 'Failed',
            error: null,
            output: output.result,
            expected,
            runtime: Math.round(output.runtime * 100) / 100,
            memory: Math.round(output.memory * 100) / 100
          });
        } catch (e) {
          resolve({
            status: 'Runtime Error',
            error: `Failed to parse output: ${stdout || 'No output'}`,
            output: stdout,
            expected,
            runtime: endTime - startTime,
            memory: 0
          });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        resolve({
          status: 'Runtime Error',
          error: err.message,
          output: null,
          expected,
          runtime: 0,
          memory: 0
        });
      });
    });
  }

  compareResults(actual, expected) {
    // Handle multiple acceptable answers
    if (Array.isArray(expected) && expected.some(e => typeof e === 'string' || typeof e === 'number')) {
      // Check if it's a "multiple correct answers" case
      if (typeof actual === 'string' || typeof actual === 'number') {
        return expected.includes(actual);
      }
    }
    
    // Deep comparison
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
}

module.exports = new CodeExecutor();
