const db = require('./database');

// Clear existing data (order matters due to foreign keys)
db.exec('DELETE FROM submissions');
db.exec('DELETE FROM problems');

// Define available topics
const TOPICS = [
  'Arrays',
  'Strings',
  'Hash Table',
  'Dynamic Programming',
  'Math',
  'Sorting',
  'Stack',
  'Tree',
  'Graph',
  'Binary Search',
  'Linked List',
  'Two Pointers',
  'Sliding Window',
  'Recursion',
  'Database',
  'Concurrency',
  'JavaScript',
  'Design'
];

const problems = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    topics: ['Arrays', 'Hash Table'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: JSON.stringify([
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: ''
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: ''
      }
    ]),
    constraints: `- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
    starter_code: JSON.stringify({
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Your code here
}`,
      python: `def two_sum(nums: list, target: int) -> list:
    # Your code here
    pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
}`,
      c: `#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Your code here
    *returnSize = 2;
    int* result = malloc(2 * sizeof(int));
    return result;
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        return {};
    }
};`,
      csharp: `public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1], isHidden: false },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2], isHidden: false },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1], isHidden: false },
      { input: { nums: [1, 5, 8, 3, 9], target: 12 }, expected: [3, 4], isHidden: true },
      { input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expected: [2, 4], isHidden: true }
    ])
  },
  {
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    difficulty: 'Easy',
    topics: ['Math', 'Strings'],
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a palindrome, and \`false\` otherwise.

An integer is a palindrome when it reads the same backward as forward.`,
    examples: JSON.stringify([
      {
        input: 'x = 121',
        output: 'true',
        explanation: '121 reads as 121 from left to right and from right to left.'
      },
      {
        input: 'x = -121',
        output: 'false',
        explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.'
      },
      {
        input: 'x = 10',
        output: 'false',
        explanation: 'Reads 01 from right to left. Therefore it is not a palindrome.'
      }
    ]),
    constraints: `- -2^31 <= x <= 2^31 - 1`,
    starter_code: JSON.stringify({
      javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindrome(x) {
    // Your code here
}`,
      python: `def is_palindrome(x: int) -> bool:
    # Your code here
    pass`,
      java: `class Solution {
    public boolean isPalindrome(int x) {
        // Your code here
        return false;
    }
}`,
      c: `#include <stdbool.h>

bool isPalindrome(int x) {
    // Your code here
    return false;
}`,
      cpp: `class Solution {
public:
    bool isPalindrome(int x) {
        // Your code here
        return false;
    }
};`,
      csharp: `public class Solution {
    public bool IsPalindrome(int x) {
        // Your code here
        return false;
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { x: 121 }, expected: true, isHidden: false },
      { input: { x: -121 }, expected: false, isHidden: false },
      { input: { x: 10 }, expected: false, isHidden: false },
      { input: { x: 12321 }, expected: true, isHidden: true },
      { input: { x: 0 }, expected: true, isHidden: true }
    ])
  },
  {
    title: 'Valid Parentheses',
    topics: ['Strings', 'Stack'],
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: JSON.stringify([
      {
        input: 's = "()"',
        output: 'true',
        explanation: ''
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: ''
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: ''
      }
    ]),
    constraints: `- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'.`,
    starter_code: JSON.stringify({
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Your code here
}`,
      python: `def is_valid(s: str) -> bool:
    # Your code here
    pass`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Your code here
        return false;
    }
}`,
      c: `#include <stdbool.h>
#include <string.h>

bool isValid(char* s) {
    // Your code here
    return false;
}`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        // Your code here
        return false;
    }
};`,
      csharp: `public class Solution {
    public bool IsValid(string s) {
        // Your code here
        return false;
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { s: "()" }, expected: true, isHidden: false },
      { input: { s: "()[]{}" }, expected: true, isHidden: false },
      { input: { s: "(]" }, expected: false, isHidden: false },
      { input: { s: "([{}])" }, expected: true, isHidden: true },
      { input: { s: "(((" }, expected: false, isHidden: true }
    ])
  },
  {
    title: 'Reverse Linked List',
    topics: ['Linked List', 'Recursion'],
    slug: 'reverse-linked-list',
    difficulty: 'Medium',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

For this problem, you'll work with arrays representing linked list nodes. Reverse the array to simulate reversing a linked list.`,
    examples: JSON.stringify([
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]',
        explanation: ''
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]',
        explanation: ''
      },
      {
        input: 'head = []',
        output: '[]',
        explanation: ''
      }
    ]),
    constraints: `- The number of nodes in the list is in the range [0, 5000].
- -5000 <= Node.val <= 5000`,
    starter_code: JSON.stringify({
      javascript: `/**
 * @param {number[]} head
 * @return {number[]}
 */
function reverseList(head) {
    // Your code here
}`,
      python: `def reverse_list(head: list) -> list:
    # Your code here
    pass`,
      java: `class Solution {
    public int[] reverseList(int[] head) {
        // Your code here
        return new int[]{};
    }
}`,
      c: `int* reverseList(int* head, int headSize, int* returnSize) {
    // Your code here
    *returnSize = headSize;
    int* result = malloc(headSize * sizeof(int));
    return result;
}`,
      cpp: `class Solution {
public:
    vector<int> reverseList(vector<int>& head) {
        // Your code here
        return {};
    }
};`,
      csharp: `public class Solution {
    public int[] ReverseList(int[] head) {
        // Your code here
        return new int[]{};
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { head: [1, 2, 3, 4, 5] }, expected: [5, 4, 3, 2, 1], isHidden: false },
      { input: { head: [1, 2] }, expected: [2, 1], isHidden: false },
      { input: { head: [] }, expected: [], isHidden: false },
      { input: { head: [1] }, expected: [1], isHidden: true },
      { input: { head: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }, expected: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], isHidden: true }
    ])
  },
  {
    title: 'Maximum Subarray',
    topics: ['Arrays', 'Dynamic Programming'],
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    examples: JSON.stringify([
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.'
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.'
      },
      {
        input: 'nums = [5,4,-1,7,8]',
        output: '23',
        explanation: 'The subarray [5,4,-1,7,8] has the largest sum 23.'
      }
    ]),
    constraints: `- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4`,
    starter_code: JSON.stringify({
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
    // Your code here
}`,
      python: `def max_sub_array(nums: list) -> int:
    # Your code here
    pass`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Your code here
        return 0;
    }
}`,
      c: `int maxSubArray(int* nums, int numsSize) {
    // Your code here
    return 0;
}`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Your code here
        return 0;
    }
};`,
      csharp: `public class Solution {
    public int MaxSubArray(int[] nums) {
        // Your code here
        return 0;
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expected: 6, isHidden: false },
      { input: { nums: [1] }, expected: 1, isHidden: false },
      { input: { nums: [5, 4, -1, 7, 8] }, expected: 23, isHidden: false },
      { input: { nums: [-1] }, expected: -1, isHidden: true },
      { input: { nums: [-2, -1] }, expected: -1, isHidden: true }
    ])
  },
  {
    title: 'Merge Intervals',
    topics: ['Arrays', 'Sorting'],
    slug: 'merge-intervals',
    difficulty: 'Medium',
    description: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    examples: JSON.stringify([
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].'
      },
      {
        input: 'intervals = [[1,4],[4,5]]',
        output: '[[1,5]]',
        explanation: 'Intervals [1,4] and [4,5] are considered overlapping.'
      }
    ]),
    constraints: `- 1 <= intervals.length <= 10^4
- intervals[i].length == 2
- 0 <= starti <= endi <= 10^4`,
    starter_code: JSON.stringify({
      javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function merge(intervals) {
    // Your code here
}`,
      python: `def merge(intervals: list) -> list:
    # Your code here
    pass`,
      java: `class Solution {
    public int[][] merge(int[][] intervals) {
        // Your code here
        return new int[][]{};
    }
}`,
      c: `int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {
    // Your code here
    *returnSize = 0;
    return NULL;
}`,
      cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // Your code here
        return {};
    }
};`,
      csharp: `public class Solution {
    public int[][] Merge(int[][] intervals) {
        // Your code here
        return new int[][]{};
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] }, expected: [[1, 6], [8, 10], [15, 18]], isHidden: false },
      { input: { intervals: [[1, 4], [4, 5]] }, expected: [[1, 5]], isHidden: false },
      { input: { intervals: [[1, 4], [0, 4]] }, expected: [[0, 4]], isHidden: true },
      { input: { intervals: [[1, 4], [2, 3]] }, expected: [[1, 4]], isHidden: true }
    ])
  },
  {
    title: 'Longest Palindromic Substring',
    topics: ['Strings', 'Dynamic Programming'],
    slug: 'longest-palindromic-substring',
    difficulty: 'Hard',
    description: `Given a string \`s\`, return the longest palindromic substring in \`s\`.

A palindrome is a string that reads the same forward and backward.`,
    examples: JSON.stringify([
      {
        input: 's = "babad"',
        output: '"bab"',
        explanation: '"aba" is also a valid answer.'
      },
      {
        input: 's = "cbbd"',
        output: '"bb"',
        explanation: ''
      }
    ]),
    constraints: `- 1 <= s.length <= 1000
- s consist of only digits and English letters.`,
    starter_code: JSON.stringify({
      javascript: `/**
 * @param {string} s
 * @return {string}
 */
function longestPalindrome(s) {
    // Your code here
}`,
      python: `def longest_palindrome(s: str) -> str:
    # Your code here
    pass`,
      java: `class Solution {
    public String longestPalindrome(String s) {
        // Your code here
        return "";
    }
}`,
      c: `char* longestPalindrome(char* s) {
    // Your code here
    return "";
}`,
      cpp: `class Solution {
public:
    string longestPalindrome(string s) {
        // Your code here
        return "";
    }
};`,
      csharp: `public class Solution {
    public string LongestPalindrome(string s) {
        // Your code here
        return "";
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { s: "babad" }, expected: ["bab", "aba"], isHidden: false, multiple: true },
      { input: { s: "cbbd" }, expected: "bb", isHidden: false },
      { input: { s: "a" }, expected: "a", isHidden: true },
      { input: { s: "racecar" }, expected: "racecar", isHidden: true }
    ])
  },
  {
    title: 'Trapping Rain Water',
    topics: ['Arrays', 'Two Pointers', 'Stack'],
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: JSON.stringify([
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.'
      },
      {
        input: 'height = [4,2,0,3,2,5]',
        output: '9',
        explanation: ''
      }
    ]),
    constraints: `- n == height.length
- 1 <= n <= 2 * 10^4
- 0 <= height[i] <= 10^5`,
    starter_code: JSON.stringify({
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
    // Your code here
}`,
      python: `def trap(height: list) -> int:
    # Your code here
    pass`,
      java: `class Solution {
    public int trap(int[] height) {
        // Your code here
        return 0;
    }
}`,
      c: `int trap(int* height, int heightSize) {
    // Your code here
    return 0;
}`,
      cpp: `class Solution {
public:
    int trap(vector<int>& height) {
        // Your code here
        return 0;
    }
};`,
      csharp: `public class Solution {
    public int Trap(int[] height) {
        // Your code here
        return 0;
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] }, expected: 6, isHidden: false },
      { input: { height: [4, 2, 0, 3, 2, 5] }, expected: 9, isHidden: false },
      { input: { height: [1, 2, 3, 4, 5] }, expected: 0, isHidden: true },
      { input: { height: [5, 4, 3, 2, 1] }, expected: 0, isHidden: true }
    ])
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    topics: ['Arrays', 'Binary Search'],
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with O(log n) runtime complexity.`,
    examples: JSON.stringify([
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4'
      },
      {
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1'
      }
    ]),
    constraints: `- 1 <= nums.length <= 10^4
- -10^4 < nums[i], target < 10^4
- All the integers in nums are unique
- nums is sorted in ascending order`,
    starter_code: JSON.stringify({
      javascript: `function search(nums, target) {
    // Your code here
}`,
      python: `def search(nums: list, target: int) -> int:
    # Your code here
    pass`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        // Your code here
        return -1;
    }
}`,
      c: `int search(int* nums, int numsSize, int target) {
    // Your code here
    return -1;
}`,
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Your code here
        return -1;
    }
};`,
      csharp: `public class Solution {
    public int Search(int[] nums, int target) {
        // Your code here
        return -1;
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 }, expected: 4, isHidden: false },
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 }, expected: -1, isHidden: false },
      { input: { nums: [5], target: 5 }, expected: 0, isHidden: true },
      { input: { nums: [2, 5], target: 5 }, expected: 1, isHidden: true }
    ])
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    topics: ['Dynamic Programming', 'Math', 'Recursion'],
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    examples: JSON.stringify([
      {
        input: 'n = 2',
        output: '2',
        explanation: 'There are two ways to climb to the top: 1+1 and 2'
      },
      {
        input: 'n = 3',
        output: '3',
        explanation: 'There are three ways: 1+1+1, 1+2, and 2+1'
      }
    ]),
    constraints: `- 1 <= n <= 45`,
    starter_code: JSON.stringify({
      javascript: `function climbStairs(n) {
    // Your code here
}`,
      python: `def climb_stairs(n: int) -> int:
    # Your code here
    pass`,
      java: `class Solution {
    public int climbStairs(int n) {
        // Your code here
        return 0;
    }
}`,
      c: `int climbStairs(int n) {
    // Your code here
    return 0;
}`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        // Your code here
        return 0;
    }
};`,
      csharp: `public class Solution {
    public int ClimbStairs(int n) {
        // Your code here
        return 0;
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { n: 2 }, expected: 2, isHidden: false },
      { input: { n: 3 }, expected: 3, isHidden: false },
      { input: { n: 4 }, expected: 5, isHidden: true },
      { input: { n: 5 }, expected: 8, isHidden: true }
    ])
  },
  {
    title: 'First Unique Character',
    slug: 'first-unique-character',
    difficulty: 'Easy',
    topics: ['Strings', 'Hash Table'],
    description: `Given a string \`s\`, find the first non-repeating character in it and return its index. If it does not exist, return \`-1\`.`,
    examples: JSON.stringify([
      {
        input: 's = "leetcode"',
        output: '0',
        explanation: 'The first non-repeating character is "l" at index 0'
      },
      {
        input: 's = "loveleetcode"',
        output: '2',
        explanation: 'The first non-repeating character is "v" at index 2'
      },
      {
        input: 's = "aabb"',
        output: '-1',
        explanation: 'No non-repeating character exists'
      }
    ]),
    constraints: `- 1 <= s.length <= 10^5
- s consists of only lowercase English letters`,
    starter_code: JSON.stringify({
      javascript: `function firstUniqChar(s) {
    // Your code here
}`,
      python: `def first_uniq_char(s: str) -> int:
    # Your code here
    pass`,
      java: `class Solution {
    public int firstUniqChar(String s) {
        // Your code here
        return -1;
    }
}`,
      c: `int firstUniqChar(char* s) {
    // Your code here
    return -1;
}`,
      cpp: `class Solution {
public:
    int firstUniqChar(string s) {
        // Your code here
        return -1;
    }
};`,
      csharp: `public class Solution {
    public int FirstUniqChar(string s) {
        // Your code here
        return -1;
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { s: "leetcode" }, expected: 0, isHidden: false },
      { input: { s: "loveleetcode" }, expected: 2, isHidden: false },
      { input: { s: "aabb" }, expected: -1, isHidden: false },
      { input: { s: "z" }, expected: 0, isHidden: true }
    ])
  },
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz',
    difficulty: 'Easy',
    topics: ['Math', 'Strings', 'JavaScript'],
    description: `Given an integer \`n\`, return a string array \`answer\` (1-indexed) where:
- \`answer[i] == "FizzBuzz"\` if \`i\` is divisible by 3 and 5.
- \`answer[i] == "Fizz"\` if \`i\` is divisible by 3.
- \`answer[i] == "Buzz"\` if \`i\` is divisible by 5.
- \`answer[i] == i\` (as a string) if none of the above conditions are true.`,
    examples: JSON.stringify([
      {
        input: 'n = 3',
        output: '["1","2","Fizz"]',
        explanation: ''
      },
      {
        input: 'n = 5',
        output: '["1","2","Fizz","4","Buzz"]',
        explanation: ''
      },
      {
        input: 'n = 15',
        output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
        explanation: ''
      }
    ]),
    constraints: `- 1 <= n <= 10^4`,
    starter_code: JSON.stringify({
      javascript: `function fizzBuzz(n) {
    // Your code here
}`,
      python: `def fizz_buzz(n: int) -> list:
    # Your code here
    pass`,
      java: `class Solution {
    public String[] fizzBuzz(int n) {
        // Your code here
        return new String[]{};
    }
}`,
      c: `char** fizzBuzz(int n, int* returnSize) {
    // Your code here
    *returnSize = n;
    return NULL;
}`,
      cpp: `class Solution {
public:
    vector<string> fizzBuzz(int n) {
        // Your code here
        return {};
    }
};`,
      csharp: `public class Solution {
    public string[] FizzBuzz(int n) {
        // Your code here
        return new string[]{};
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { n: 3 }, expected: ["1", "2", "Fizz"], isHidden: false },
      { input: { n: 5 }, expected: ["1", "2", "Fizz", "4", "Buzz"], isHidden: false },
      { input: { n: 15 }, expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"], isHidden: true }
    ])
  },
  {
    title: 'Move Zeroes',
    slug: 'move-zeroes',
    difficulty: 'Easy',
    topics: ['Arrays', 'Two Pointers'],
    description: `Given an integer array \`nums\`, move all \`0\`'s to the end of it while maintaining the relative order of the non-zero elements.

Note that you must do this in-place without making a copy of the array.`,
    examples: JSON.stringify([
      {
        input: 'nums = [0,1,0,3,12]',
        output: '[1,3,12,0,0]',
        explanation: ''
      },
      {
        input: 'nums = [0]',
        output: '[0]',
        explanation: ''
      }
    ]),
    constraints: `- 1 <= nums.length <= 10^4
- -2^31 <= nums[i] <= 2^31 - 1`,
    starter_code: JSON.stringify({
      javascript: `function moveZeroes(nums) {
    // Modify nums in-place and return it
}`,
      python: `def move_zeroes(nums: list) -> list:
    # Modify nums in-place and return it
    pass`,
      java: `class Solution {
    public int[] moveZeroes(int[] nums) {
        // Modify nums in-place and return it
        return nums;
    }
}`,
      c: `int* moveZeroes(int* nums, int numsSize, int* returnSize) {
    // Modify nums in-place
    *returnSize = numsSize;
    return nums;
}`,
      cpp: `class Solution {
public:
    vector<int> moveZeroes(vector<int>& nums) {
        // Modify nums in-place and return it
        return nums;
    }
};`,
      csharp: `public class Solution {
    public int[] MoveZeroes(int[] nums) {
        // Modify nums in-place and return it
        return nums;
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { nums: [0, 1, 0, 3, 12] }, expected: [1, 3, 12, 0, 0], isHidden: false },
      { input: { nums: [0] }, expected: [0], isHidden: false },
      { input: { nums: [1, 2, 3] }, expected: [1, 2, 3], isHidden: true },
      { input: { nums: [0, 0, 1] }, expected: [1, 0, 0], isHidden: true }
    ])
  },
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    difficulty: 'Easy',
    topics: ['Arrays', 'Hash Table', 'Sorting'],
    description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.`,
    examples: JSON.stringify([
      {
        input: 'nums = [1,2,3,1]',
        output: 'true',
        explanation: ''
      },
      {
        input: 'nums = [1,2,3,4]',
        output: 'false',
        explanation: ''
      },
      {
        input: 'nums = [1,1,1,3,3,4,3,2,4,2]',
        output: 'true',
        explanation: ''
      }
    ]),
    constraints: `- 1 <= nums.length <= 10^5
- -10^9 <= nums[i] <= 10^9`,
    starter_code: JSON.stringify({
      javascript: `function containsDuplicate(nums) {
    // Your code here
}`,
      python: `def contains_duplicate(nums: list) -> bool:
    # Your code here
    pass`,
      java: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Your code here
        return false;
    }
}`,
      c: `#include <stdbool.h>

bool containsDuplicate(int* nums, int numsSize) {
    // Your code here
    return false;
}`,
      cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Your code here
        return false;
    }
};`,
      csharp: `public class Solution {
    public bool ContainsDuplicate(int[] nums) {
        // Your code here
        return false;
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { nums: [1, 2, 3, 1] }, expected: true, isHidden: false },
      { input: { nums: [1, 2, 3, 4] }, expected: false, isHidden: false },
      { input: { nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] }, expected: true, isHidden: false },
      { input: { nums: [1] }, expected: false, isHidden: true }
    ])
  },
  {
    title: 'Sliding Window Maximum',
    slug: 'sliding-window-maximum',
    difficulty: 'Hard',
    topics: ['Arrays', 'Sliding Window', 'Stack'],
    description: `You are given an array of integers \`nums\`, there is a sliding window of size \`k\` which is moving from the very left of the array to the very right. You can only see the \`k\` numbers in the window. Each time the sliding window moves right by one position.

Return the max sliding window.`,
    examples: JSON.stringify([
      {
        input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3',
        output: '[3,3,5,5,6,7]',
        explanation: 'Window positions and their max values'
      },
      {
        input: 'nums = [1], k = 1',
        output: '[1]',
        explanation: ''
      }
    ]),
    constraints: `- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4
- 1 <= k <= nums.length`,
    starter_code: JSON.stringify({
      javascript: `function maxSlidingWindow(nums, k) {
    // Your code here
}`,
      python: `def max_sliding_window(nums: list, k: int) -> list:
    # Your code here
    pass`,
      java: `class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        // Your code here
        return new int[]{};
    }
}`,
      c: `int* maxSlidingWindow(int* nums, int numsSize, int k, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}`,
      cpp: `class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        // Your code here
        return {};
    }
};`,
      csharp: `public class Solution {
    public int[] MaxSlidingWindow(int[] nums, int k) {
        // Your code here
        return new int[]{};
    }
}`
    }),
    test_cases: JSON.stringify([
      { input: { nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 }, expected: [3, 3, 5, 5, 6, 7], isHidden: false },
      { input: { nums: [1], k: 1 }, expected: [1], isHidden: false },
      { input: { nums: [1, -1], k: 1 }, expected: [1, -1], isHidden: true },
      { input: { nums: [9, 11], k: 2 }, expected: [11], isHidden: true }
    ])
  }
];

// Editorials for each problem
const editorials = {
  'two-sum': {
    difficulty: 'Easy',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    approaches: [
      {
        name: 'Brute Force',
        description: 'Check every pair of numbers to see if they sum to target.',
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)',
        code: {
          javascript: `function twoSum(nums, target) {
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    return [];
}`,
          python: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`
        }
      },
      {
        name: 'Hash Map (Optimal)',
        description: 'Use a hash map to store seen numbers and their indices. For each number, check if (target - current) exists in the map.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        code: {
          javascript: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
          python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`
        }
      }
    ],
    keyInsights: [
      'The brute force approach checks all pairs which takes O(n²) time.',
      'Using a hash map allows us to find the complement in O(1) time.',
      'We can do this in a single pass by checking and storing simultaneously.',
      'The hash map stores the value as key and index as value.'
    ]
  },
  'palindrome-number': {
    difficulty: 'Easy',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    approaches: [
      {
        name: 'String Conversion',
        description: 'Convert the number to a string and check if it reads the same forwards and backwards.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        code: {
          javascript: `function isPalindrome(x) {
    const str = x.toString();
    return str === str.split('').reverse().join('');
}`,
          python: `def is_palindrome(x):
    s = str(x)
    return s == s[::-1]`
        }
      },
      {
        name: 'Reverse Half (Optimal)',
        description: 'Reverse only half of the number and compare. This avoids overflow issues.',
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
        code: {
          javascript: `function isPalindrome(x) {
    if (x < 0 || (x % 10 === 0 && x !== 0)) return false;
    let reversed = 0;
    while (x > reversed) {
        reversed = reversed * 10 + x % 10;
        x = Math.floor(x / 10);
    }
    return x === reversed || x === Math.floor(reversed / 10);
}`,
          python: `def is_palindrome(x):
    if x < 0 or (x % 10 == 0 and x != 0):
        return False
    reversed_num = 0
    while x > reversed_num:
        reversed_num = reversed_num * 10 + x % 10
        x //= 10
    return x == reversed_num or x == reversed_num // 10`
        }
      }
    ],
    keyInsights: [
      'Negative numbers are never palindromes due to the minus sign.',
      'Numbers ending in 0 (except 0 itself) cannot be palindromes.',
      'Reversing only half avoids integer overflow issues.',
      'For odd-length numbers, we need to remove the middle digit from reversed.'
    ]
  },
  'valid-parentheses': {
    difficulty: 'Easy',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    approaches: [
      {
        name: 'Stack',
        description: 'Use a stack to match opening and closing brackets. Push opening brackets, pop and match for closing brackets.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        code: {
          javascript: `function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    
    for (const char of s) {
        if (char in map) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}`,
          python: `def is_valid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    
    for char in s:
        if char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            stack.append(char)
    return len(stack) == 0`
        }
      }
    ],
    keyInsights: [
      'A stack is perfect for matching nested structures.',
      'Opening brackets are pushed onto the stack.',
      'Closing brackets should match the most recent opening bracket.',
      'The string is valid only if the stack is empty at the end.'
    ]
  },
  'maximum-subarray': {
    difficulty: 'Medium',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    approaches: [
      {
        name: "Kadane's Algorithm",
        description: 'Track the maximum sum ending at each position. Reset to current element if the running sum becomes negative.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        code: {
          javascript: `function maxSubArray(nums) {
    let maxSum = nums[0];
    let currentSum = nums[0];
    
    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}`,
          python: `def max_sub_array(nums):
    max_sum = current_sum = nums[0]
    
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum`
        }
      },
      {
        name: 'Divide and Conquer',
        description: 'Recursively find maximum subarray in left half, right half, and crossing the middle.',
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(log n)',
        code: {
          javascript: `function maxSubArray(nums) {
    return divideConquer(nums, 0, nums.length - 1);
}

function divideConquer(nums, left, right) {
    if (left === right) return nums[left];
    
    const mid = Math.floor((left + right) / 2);
    const leftMax = divideConquer(nums, left, mid);
    const rightMax = divideConquer(nums, mid + 1, right);
    const crossMax = maxCrossing(nums, left, mid, right);
    
    return Math.max(leftMax, rightMax, crossMax);
}`,
          python: `def max_sub_array(nums):
    def divide_conquer(left, right):
        if left == right:
            return nums[left]
        
        mid = (left + right) // 2
        left_max = divide_conquer(left, mid)
        right_max = divide_conquer(mid + 1, right)
        cross_max = max_crossing(left, mid, right)
        
        return max(left_max, right_max, cross_max)
    
    return divide_conquer(0, len(nums) - 1)`
        }
      }
    ],
    keyInsights: [
      "Kadane's algorithm is the optimal solution with O(n) time.",
      'At each position, we decide whether to extend or start a new subarray.',
      'If current sum becomes negative, starting fresh is always better.',
      'The divide and conquer approach demonstrates an alternative paradigm.'
    ]
  },
  'binary-search': {
    difficulty: 'Easy',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    approaches: [
      {
        name: 'Iterative Binary Search',
        description: 'Repeatedly divide the search space in half by comparing with the middle element.',
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
        code: {
          javascript: `function search(nums, target) {
    let left = 0, right = nums.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
          python: `def search(nums, target):
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`
        }
      },
      {
        name: 'Recursive Binary Search',
        description: 'Same concept but implemented recursively.',
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(log n)',
        code: {
          javascript: `function search(nums, target, left = 0, right = nums.length - 1) {
    if (left > right) return -1;
    
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) return search(nums, target, mid + 1, right);
    return search(nums, target, left, mid - 1);
}`,
          python: `def search(nums, target, left=None, right=None):
    if left is None: left, right = 0, len(nums) - 1
    if left > right: return -1
    
    mid = (left + right) // 2
    if nums[mid] == target: return mid
    if nums[mid] < target: return search(nums, target, mid + 1, right)
    return search(nums, target, left, mid - 1)`
        }
      }
    ],
    keyInsights: [
      'Binary search requires a sorted array.',
      'Each iteration eliminates half of the remaining elements.',
      'Use left <= right to handle all cases including single element.',
      'Be careful with integer overflow when calculating mid: use left + (right - left) / 2.'
    ]
  },
  'climbing-stairs': {
    difficulty: 'Easy',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    approaches: [
      {
        name: 'Dynamic Programming',
        description: 'The number of ways to reach step n is the sum of ways to reach step n-1 and n-2 (Fibonacci sequence).',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        code: {
          javascript: `function climbStairs(n) {
    if (n <= 2) return n;
    let prev2 = 1, prev1 = 2;
    
    for (let i = 3; i <= n; i++) {
        const current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}`,
          python: `def climb_stairs(n):
    if n <= 2: return n
    prev2, prev1 = 1, 2
    
    for i in range(3, n + 1):
        current = prev1 + prev2
        prev2 = prev1
        prev1 = current
    return prev1`
        }
      },
      {
        name: 'Recursion with Memoization',
        description: 'Recursive solution with caching to avoid redundant calculations.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        code: {
          javascript: `function climbStairs(n, memo = {}) {
    if (n <= 2) return n;
    if (memo[n]) return memo[n];
    memo[n] = climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
    return memo[n];
}`,
          python: `from functools import lru_cache

@lru_cache(maxsize=None)
def climb_stairs(n):
    if n <= 2: return n
    return climb_stairs(n - 1) + climb_stairs(n - 2)`
        }
      }
    ],
    keyInsights: [
      'This is essentially the Fibonacci sequence.',
      'To reach step n, you either came from step n-1 or n-2.',
      'Space can be optimized to O(1) by only keeping track of last two values.',
      'Base cases: 1 way to reach step 1, 2 ways to reach step 2.'
    ]
  }
};

// Add default editorial for problems without one
const defaultEditorial = {
  difficulty: 'Medium',
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  approaches: [
    {
      name: 'Solution Approach',
      description: 'Editorial coming soon. Try solving this problem on your own first!',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      code: {
        javascript: '// Solution coming soon',
        python: '# Solution coming soon'
      }
    }
  ],
  keyInsights: [
    'Think about the problem constraints.',
    'Consider edge cases.',
    'Try to optimize from brute force.'
  ]
};

const insertProblem = db.prepare(`
  INSERT INTO problems (title, slug, difficulty, description, examples, constraints, starter_code, test_cases, topics, editorial)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const problem of problems) {
  const editorial = editorials[problem.slug] || defaultEditorial;
  insertProblem.run(
    problem.title,
    problem.slug,
    problem.difficulty,
    problem.description,
    problem.examples,
    problem.constraints,
    problem.starter_code,
    problem.test_cases,
    JSON.stringify(problem.topics || []),
    JSON.stringify(editorial)
  );
}

console.log(`Seeded ${problems.length} problems successfully!`);
console.log(`Topics: ${TOPICS.join(', ')}`);
console.log(`Editorials: ${Object.keys(editorials).length} detailed, ${problems.length - Object.keys(editorials).length} default`);
