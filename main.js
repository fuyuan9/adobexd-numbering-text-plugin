const { Color, Rectangle, Text } = require("scenegraph");
const commands = require("commands");
const clipboard = require("clipboard");
const {
  error
} = require("./node_modules/@adobe/xd-plugin-toolkit/lib/dialogs.js");
const { Parser } = require("./node_modules/json2csv/dist/json2csv.umd.js");

const NUMBERED_GROUP_NAME = "__NUMBERED__";
const LABEL_WIDTH = 42;
const LABEL_HEIGHT = 26;
const LABEL_FILL_COLOR = new Color("Red");
const LABEL_OPACITY = 0.7;
const LABEL_FONT_FAMILY = "Arial";
const LABEL_FONT_SIZE = 19;
const LABEL_FONT_STYLE = "Bold";
const LABEL_TEXT_COLOR = new Color("White");

function createLabel(selection, childNode, textContent) {
  const rect = new Rectangle();
  rect.width = LABEL_WIDTH;
  rect.height = LABEL_HEIGHT;
  rect.fill = LABEL_FILL_COLOR;
  rect.opacity = LABEL_OPACITY;
  selection.insertionParent.addChild(rect);

  const text = new Text();
  text.text = textContent;
  text.fontFamily = LABEL_FONT_FAMILY;
  text.fontSize = LABEL_FONT_SIZE;
  text.fontStyle = LABEL_FONT_STYLE;
  text.fill = LABEL_TEXT_COLOR;
  text.textAlign = Text.ALIGN_CENTER;
  selection.insertionParent.addChild(text);

  selection.items = [rect, text];
  commands.alignVerticalCenter();
  commands.alignHorizontalCenter();
  commands.group();
  const group = selection.items[0];
  // FIXME: In case "repeat grid"
  const bounds = childNode.globalBounds;
  const deltaX = bounds.x;
  const deltaY = bounds.y;
  group.moveInParentCoordinates(deltaX, deltaY);

  return group;
}

function findText(childNode) {
  let buff = [];
  childNode.children.forEach(node => {
    if (node instanceof Text) {
      buff.push(node);
    } else if (node.name !== NUMBERED_GROUP_NAME) {
      buff = [...buff, ...findText(node)];
    }
  });

  return buff;
}

function sortByCoordinates(nodeArray) {
  return nodeArray.sort((a, b) => {
    const ax = a.globalBounds.x;
    const ay = a.globalBounds.y;
    const bx = b.globalBounds.x;
    const by = b.globalBounds.y;
    const p = Math.sqrt(Math.pow(ax, 2) + Math.pow(ay, 2) * 10000);
    const q = Math.sqrt(Math.pow(bx, 2) + Math.pow(by, 2) * 10000);

    return p - q;
  });
}

async function main(selection) {
  const currentSelection = selection.items;
  if (currentSelection.length === 0) {
    await error(
      "Error",
      "No selected items. Please select an artboard and run."
    );

    return;
  }
  const rootNode = selection.insertionParent;
  const textNodeArray = sortByCoordinates(findText(rootNode));
  const labels = textNodeArray.map((childNode, index) => {
    return createLabel(selection, childNode, `${index + 1}`);
  });

  selection.items = labels;
  commands.group();
  const group = selection.items[0];
  group.name = NUMBERED_GROUP_NAME;

  selection.items = currentSelection;

  const data = textNodeArray.map((childNode, index) => {
    return { id: `${index + 1}`, text: childNode.text };
  });
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(data);
  clipboard.copyText(csv);
}

module.exports = {
  commands: {
    main: main
  }
};
