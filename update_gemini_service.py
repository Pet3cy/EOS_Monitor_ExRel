import re

file_path = "services/geminiService.ts"

with open(file_path, "r") as f:
    content = f.read()

# Helper function definition
validate_function = """
const validateAnalysisResult = (data: any) => {
  const requiredFields = [
    "sender",
    "institution",
    "eventName",
    "priority",
    "priorityScore",
    "date",
    "venue",
    "description",
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
};
"""

# Insert helper function before analyzeInvitation
if "export const analyzeInvitation" in content:
    content = content.replace("export const analyzeInvitation", validate_function + "\nexport const analyzeInvitation")

# Replace the try-catch block
old_block = r"""  let data;
  try {
    data = JSON.parse\(response.text \|\| "{}"\);
  } catch \(error\) {
    console.error\("Failed to parse Gemini response:", response.text\);
    throw new Error\("Failed to parse analysis result from AI service"\);
  }"""

new_block = """  let data;
  try {
    data = JSON.parse(response.text || "{}");
    validateAnalysisResult(data);
  } catch (error) {
    console.error("Failed to parse Gemini response:", response.text?.slice(0, 200));
    throw new Error("Failed to parse analysis result from AI service: " + (error instanceof Error ? error.message : "Unknown error"));
  }"""

# Use regex to replace because of whitespace variations potential, but simple string replace is safer if exact match
# Let's try direct replace first, assuming the cat output was exact.
content = content.replace('  let data;\n  try {\n    data = JSON.parse(response.text || "{}");\n  } catch (error) {\n    console.error("Failed to parse Gemini response:", response.text);\n    throw new Error("Failed to parse analysis result from AI service");\n  }', new_block)

with open(file_path, "w") as f:
    f.write(content)
