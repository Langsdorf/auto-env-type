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

  vscode.workspace.onDidSaveTextDocument(async (e) => {
    if (!e.fileName.endsWith(".env")) {
      return;
    }

    const path = e.fileName.split("/").slice(0, -1).join("/");

    const isEnabled = vscode.workspace
      .getConfiguration("auto-env-type")
      .get<boolean>("enabled");

    if (!isEnabled) {
      console.log("auto-env-type is not enabled. Exiting...");
      return;
    }

    const hasPackageJson = await vscode.workspace.findFiles(
      `${path}/package.json`
    );

    if (!hasPackageJson) {
      console.log("No package.json found. Exiting...");
      return;
    }

    const hasTsConfig = await vscode.workspace.findFiles(
      `${path}/tsconfig.json`
    );

    if (!hasTsConfig) {
      console.log("No tsconfig.json found. Exiting...");
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
        .map((key, i) => (i === 0 ? `${key}?: string;` : `	  ${key}?: string;`))
        .join("\n")
    ).substring(1);

    const file = vscode.Uri.file(`${path}/env.d.ts`);

    const wsEdit = new vscode.WorkspaceEdit();

    wsEdit.createFile(file, { ignoreIfExists: true });

    await vscode.workspace.applyEdit(wsEdit);

    await vscode.workspace.fs.writeFile(
      file,
      new TextEncoder().encode(content)
    );
  });
}

export function deactivate() {}
