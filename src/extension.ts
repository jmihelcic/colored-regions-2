import * as vscode from 'vscode';
import * as path from 'path';


interface NamedColorsMap {
    [key: string]: string;
}

interface DecoratorMap {
    [key: string]: DecoratorDescription;
}

interface DecoratorDescription {
    name: string;
    regions: vscode.DecorationOptions[];
    decorator: undefined | vscode.TextEditorDecorationType;
}

interface DecoratorInstances {
    [key: string]: vscode.TextEditorDecorationType;
}

const namedColors: NamedColorsMap = {};
const decoratorInstances: DecoratorInstances = {};
let regionRegex = /[Rr]egion ?\[( ?[\w\d., ()]+ ?)\]([\s\S]*?)[Ee]nd ?[Rr]egion/g;
const colorRegex = /rgba\(\d{1,3},\d{1,3},\d{1,3},\d(?:\.\d{1,2})?\)/g;

export function activate(context: vscode.ExtensionContext) {
	vscode.window.onDidChangeActiveTextEditor(
        (editor) => {
            if (editor !== undefined) {
				console.log('Changed');
                _onColorRegions(editor);
            }
        },
        null,
        context.subscriptions
	);
	
	vscode.workspace.onDidChangeTextDocument(
        (event) => {
            vscode.window.visibleTextEditors.map((editor) => {
                if (editor.document === event.document) {
                    _onColorRegions(editor);
                }
            });
        },
        null,
        context.subscriptions
    );

    vscode.workspace.onDidChangeConfiguration(
        (event) => {
            if (event.affectsConfiguration('coloredRegions2')) {
                _readConfiguration();
            }
        }, null,
        context.subscriptions
	);
	
	_readConfiguration();
}

function _onColorRegions(activeEditor: vscode.TextEditor) {
	{
		// Clear decorations
		const keys = Object.keys(decoratorInstances);
		for (const key of keys) {
			activeEditor.setDecorations(decoratorInstances[key], []);
		}
	}

	const namedColorsKeys = Object.keys(namedColors);
	const text = activeEditor.document.getText();
	const decoratorMap: DecoratorMap = {};

	let match;
	while ((match = regionRegex.exec(text))) {
		let color = _parseColor(match[1]);

		// Color can be a name or a rgba value
		if (namedColorsKeys.indexOf(color) !== -1) {
			color = namedColors[color];
		} else if (color.match(colorRegex) === null) {
			continue;
		}

		const decorator = _createDecoratorInstance(color);
		const startPos = activeEditor.document.positionAt(match.index);
		const endPos = activeEditor.document.positionAt(
			match.index + match[0].length
		);

		const decoration = {
			range: new vscode.Range(startPos, endPos)
		};

		if (decoratorMap[color] === undefined) {
			decoratorMap[color] = {
				name: color,
				regions: [],
				decorator: undefined
			};
		}

		decoratorMap[color].regions.push(decoration);
		decoratorMap[color].decorator = decorator;
	}

	const keys = Object.keys(decoratorMap);
	for (const key of keys) {
		const decoratorDescription = decoratorMap[key];

		if (decoratorDescription.decorator !== undefined) {
			activeEditor.setDecorations(decoratorDescription.decorator, []);
			activeEditor.setDecorations(
				decoratorDescription.decorator,
				decoratorDescription.regions
			);
		}
	}
}

function _createDecoratorInstance(color: string) {
	if (decoratorInstances[color] !== undefined) {
		return decoratorInstances[color];
	}

	const instance = vscode.window.createTextEditorDecorationType({
		isWholeLine: true,
		backgroundColor: color
	});

	decoratorInstances[color] = instance;
	return instance;
}

function _parseColor(inputColor: string) {
	const cleaned = '' + inputColor.replace(/ /g, '');
	return cleaned;
}

async function _readConfiguration() {
	const configuration = _getConfiguration();
	const packageJsonConfiguration = await _getPackageConfiguration();

	if (configuration.namedColors) {
		Object.assign(namedColors, configuration.namedColors);
	}
	if (packageJsonConfiguration.namedColors) {
		Object.assign(namedColors, packageJsonConfiguration.namedColors);
	}

	if (configuration.regionRegex) {
		regionRegex = new RegExp(configuration.regionRegex, 'g');
	}
	if (packageJsonConfiguration.regionRegex) {
		regionRegex = new RegExp(packageJsonConfiguration.regionRegex, 'g');
	}
	
	vscode.window.visibleTextEditors.map((editor) => {
		_onColorRegions(editor);
	});
}

function _getConfiguration() {
	const configuration = vscode.workspace.getConfiguration('coloredRegions2');
	return configuration || {};
}

async function _getPackageConfiguration() {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if (workspaceFolders === undefined) {
		return {};
	}

	const workspacePath = workspaceFolders[0].uri.fsPath;

	try {
		const fullPath = path.join(workspacePath, 'package.json');
		const document = await vscode.workspace.openTextDocument(fullPath);
		const text = document.getText();
		const json = JSON.parse(text);

		if (json.coloredRegions2) {
			return json.coloredRegions2;
		}

	} catch (error) {
		// Fail silently
	}

	return {};
}