import * as vscode from "vscode";

const BASE_TYPE = `
declare namespace NodeJS {
	export interface ProcessEnv extends Dict<string> {
	  {#each keys}
	}
}
`;

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerCommand("auto-env-type.toggle", () => {
    const isEnabled = vscode.workspace
      .getConfiguration("auto-env-type")
      .get<boolean>("enabled");

    vscode.workspace
      .getConfiguration("auto-env-type")
      .update("enabled", !isEnabled, true);
  });

  vscode.workspace.onDidSaveTextDocument((e) => {
    if (!e.fileName.endsWith(".env")) {
      return;
    }

    const isEnabled = vscode.workspace
      .getConfiguration("auto-env-type")
      .get<boolean>("enabled");

    if (!isEnabled) {
      console.log("auto-env-type is not enabled. Exiting...");
      return;
    }

    const hasPackageJson = vscode.workspace.findFiles("package.json");

    if (!hasPackageJson) {
      console.log("No package.json found. Exiting...");
      return;
    }

    const wsPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!wsPath) {
      return;
    }

    const fileContent = e.getText();

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

    const keys = Array.from(env.keys());

    const content = BASE_TYPE.replace(
      "{#each keys}",
      keys
        .map((key, i) =>
          i === 0
            ? `${key}: string | undefined;`
            : `	  ${key}: string | undefined;`
        )
        .join("\n")
    ).substring(1);

    const file = vscode.Uri.file(`${wsPath}/env.d.ts`);

    const wsEdit = new vscode.WorkspaceEdit();

    wsEdit.createFile(file, { ignoreIfExists: true });

    vscode.workspace.applyEdit(wsEdit);

    vscode.workspace.fs
      .writeFile(file, new TextEncoder().encode(content))
      .then(() => {
        console.log("File created");
      });
  });
}

export function deactivate() {}
