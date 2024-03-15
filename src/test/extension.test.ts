import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  const fakeEnvFile = `# This is a comment
	TEST=123
	SECRET=456
	`;

  test("Should parse the .env file", () => {
    const fileContent = fakeEnvFile;

    const lines = fileContent.split("\n");

    const env = new Map();

    lines.forEach((line) => {
      if (line.startsWith("#")) {
        return;
      }

      const firstEqualIndex = line.indexOf("=");

      if (firstEqualIndex === -1) {
        return;
      }

      const key = line.substring(0, firstEqualIndex);
      const value = line.substring(firstEqualIndex + 1);

      env.set(key, value);
    });

    assert.strictEqual(env.size, 2);
  });
});
