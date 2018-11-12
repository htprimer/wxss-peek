// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const fs = require('fs')
const promisify = require('util').promisify
const readFile = promisify(fs.readFile)

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // This line of code will only be executed once when your extension is activated

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    // let disposable = vscode.commands.registerCommand('extension.sayHello', function () {
    //     // The code you place here will be executed every time your command is executed
    //     // Display a message box to the user
    //     vscode.window.showInformationMessage('Hello World!')
    // });
    // context.subscriptions.push(disposable)

    const WXML_MODE = { language: 'wxml', scheme: 'file' }
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(WXML_MODE, new WxmlDefinitionProvider()))
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;

class WxmlDefinitionProvider {
    async provideDefinition(doc, position, token) {
        let wordRange = doc.getWordRangeAtPosition(position, /class="\S+?"/)
        let word = null
        let definePath = null
        if (wordRange) {
            word = doc.getText(wordRange)
            word = word.replace(/"/g, '').replace('class=', '')
            definePath = doc.fileName.replace('.wxml', '.wxss')
        } else {
            wordRange = doc.getWordRangeAtPosition(position, /bindtap="\S+?"/)
            if (!wordRange) {
                return
            }
            word = doc.getText(wordRange)
            word = word.replace(/"/g, '').replace('bindtap=', '')
            definePath = doc.fileName.replace('.wxml', '.js')
        }
        const uri = vscode.Uri.file(definePath)
        try {
            const wxssPosition = await this.findWxssPostion(uri.path, word)
            return new vscode.Location(uri, wxssPosition)
        } catch (err) {
            return
        }
    }
    async findWxssPostion(path, token) {
        try {
            const buffer = await readFile(path)
            const lineArray = buffer.toString().split('\n')
            for (let index = 0; index < lineArray.length; index++) {
                const line = lineArray[index];
                if (line.match(token)) {
                    return new vscode.Position(index, 0)
                }
            }
        } catch (err) {
            console.log(err)
            throw err
        }
    }
} 

