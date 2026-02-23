import re

file_path = "services/geminiService.test.ts"

with open(file_path, "r") as f:
    content = f.read()

# 1. Update invalid JSON test
content = content.replace(
    "await expect(analyzeInvitation(input)).rejects.toThrow('Failed to parse analysis result from AI service');",
    "await expect(analyzeInvitation(input)).rejects.toThrow(/Failed to parse analysis result from AI service/);"
)

# 2. Update empty/null response test
old_empty_test = r"""   it('should handle empty/null response text gracefully', async () => {
      generateContentMock.mockResolvedValue({
          text: null,
      });

      const input = { text: 'Test Empty Response' }; // Unique input
      const result = await analyzeInvitation(input);

      expect(result).toEqual({
          priority: undefined,
          linkedActivities: [],
      });
  });"""

new_empty_test = """   it('should throw error on empty/null response text', async () => {
      generateContentMock.mockResolvedValue({
          text: null,
      });

      const input = { text: 'Test Empty Response' }; // Unique input
      await expect(analyzeInvitation(input)).rejects.toThrow(/Missing required field: sender/);
  });"""

content = content.replace(old_empty_test, new_empty_test)

# 3. Add missing fields test
new_test_case = """
  it('should throw error when analysis result is missing required fields', async () => {
      const mockResponseData = {
          sender: 'Test Sender',
          // Missing other required fields
      };

      generateContentMock.mockResolvedValue({
          text: JSON.stringify(mockResponseData),
      });

      const input = { text: 'Test Missing Fields' };

      await expect(analyzeInvitation(input)).rejects.toThrow(/Missing required field/);
  });
"""

# Insert before "it('should throw error when API_KEY is missing'"
if "it('should throw error when API_KEY is missing'" in content:
    content = content.replace("it('should throw error when API_KEY is missing'", new_test_case + "\n  it('should throw error when API_KEY is missing'")

with open(file_path, "w") as f:
    f.write(content)
