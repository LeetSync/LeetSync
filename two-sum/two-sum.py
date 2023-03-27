class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        l,r = 0 , len(nums) - 1

        for i in range(len(nums)):
            rem = target - nums[i]
            if(rem in nums[i+1:]):
                return [i, nums.index(rem, i+1)]
             
        return []