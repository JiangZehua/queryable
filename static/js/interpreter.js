import {execute} from "./execution.js";

const introText =
`<b><a href="https://cs61a.org" target="_blank">CS 61A</a> SQL Web Interpreter</b>
--------------------------------------------------------------------------------
Welcome to the 61A SQL interpreter! 
Type <code>.help</code> for instructions, or <code>.read</code> to load a file from your computer.
The tables used in homework, labs, and lecture are already available to use.
Check out the code for this app on <a href="https://github.com/Cal-CS-61A-Staff/queryable" target="_blank">GitHub</a>.
`;

function initializeAce(editorDiv) {
    let editor = ace.edit(editorDiv);
    ace.config.set("packaged", true);
    editor.session.setMode("ace/mode/sql");
    editor.setOption("fontSize", 14);
    editor.setOption("minLines", 1);
    editor.setOption("maxLines", 100);
    editor.setOption("highlightActiveLine", false);
    editor.setOption("showPrintMargin", false);
    editor.container.style.background = "white";
    editor.session.gutterRenderer = {
        getWidth: function (session, lastLineNumber, config) {
            return 6 * config.characterWidth;
        },
        getText: function () {
            return "sqlite>";
        }
    };
    editor.focus();

    $(document).click(function() {
        setTimeout(() => {
            if (window.getSelection().rangeCount === 0 ||
                window.getSelection().getRangeAt(0).collapsed) {
                editor.focus();
            }
        }, 0);
    });

    return editor;
}

export function initializeInterpreter(divName) {
    let template =
        `
        <div class="output-wrapper">
            <div class="output-holder">
                <div class="output">${introText}</div>
            </div>
            <div class="console-wrapper">
                <div class="console-input"></div>
            </div>
        </div>`;

    let history = [""];
    let loaded = JSON.parse(localStorage.getItem('history'));
    if (loaded) {
        history = loaded;
    }

    let i = history.length - 1;

    let div = $(`#${divName}`);
    div.html(template);

    let outputDiv = div.find(`.output`);
    let editorDiv = div.find(`.console-input`).get(0);
    let editor = initializeAce(editorDiv);

    bindKeyboardShortcuts();

    editor.getSession().on("change", function () {
        let val = editor.getValue();
        val = val.replace(/\r/g, "");
        if (val.slice(-1) === "\n") {
            run(val);
        }
    });

    async function run(val) {
        val = val.trim();
        editor.setReadOnly(true);
        editor.setReadOnly(false);
        editor.setValue("", 0);
        editor.focus();
        setTimeout(function () {
            editor.setValue("", 0);
        }, 10);
        i = history.length - 1;
        history[i] = val.trim();
        ++i;
        history.push("");

        localStorage.setItem('history', JSON.stringify(history));

        let displayVal = val.replace(/\n/g, "\n        ");
        outputDiv.append("sqlite> " + displayVal + "\n");

        let ret = await execute(val);

        for (let val of ret) {
            console.log(val);
            outputDiv.append(val);
            outputDiv.append("\n");
        }
    }

    function bindKeyboardShortcuts() {
        let old_up_arrow = editor.commands.commandKeyBinding.up;
        editor.commands.addCommand({
            name: "uparrow",
            bindKey: { win: "Up", mac: "Up" },
            exec: function(editor, ...rest) {
                if (editor.getCursorPosition().row === 0) {
                    if (i > 0) {
                        --i;
                    }
                    editor.setValue(history[i]);
                    editor.selection.clearSelection();
                } else {
                    old_up_arrow.exec(editor, ...rest);
                }
            },
        });

        editor.commands.addCommand({
            name: "ctrl-enter",
            bindKey: { win: "Ctrl+Enter", mac: "Cmd+Enter"},
            exec: function(editor, ...rest) {run(editor.getValue().replace(/\r/g, ""));}
        });

        editor.commands.removeCommand('find');
        editor.commands.removeCommand('gotoline');

        editor.commands.addCommand({
            name: "ctrl-l",
            bindKey: { win: "Ctrl+L", mac: "Ctrl+L"},
            exec: function(editor, ...rest) { outputDiv.html(""); }
        });

        let old_down_arrow = editor.commands.commandKeyBinding.down;
        editor.commands.addCommand({
            name: "downarrow",
            bindKey: { win: "Down", mac: "Down" },
            exec: function(editor, ...rest) {
                let numLines = editor.getSession().getLength();
                if (editor.getCursorPosition().row === numLines - 1) {
                    if (i < history.length - 1) {
                        ++i;
                    }
                    editor.setValue(history[i]);
                    editor.selection.clearSelection();
                } else {
                    old_down_arrow.exec(editor, ...rest);
                }
            },
        });
    }
}