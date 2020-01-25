const { Color, Rectangle, Text } = require("scenegraph");
const commands = require("commands");
const {
  error
} = require("./node_modules/@adobe/xd-plugin-toolkit/lib/dialogs.js");

function createLabel(selection, childNode, textContent) {
  const rect = new Rectangle();
  rect.width = 26;
  rect.height = 26;
  rect.fill = new Color("Red");
  rect.opacity = 0.7;
  selection.insertionParent.addChild(rect);

  const text = new Text();
  text.text = textContent;
  text.fontFamily = "Arial";
  text.fontSize = 19;
  text.fontStyle = "Bold";
  text.fill = new Color("White");
  text.textAlign = Text.ALIGN_CENTER;
  selection.insertionParent.addChild(text);

  selection.items = [rect, text];
  commands.alignVerticalCenter();
  commands.alignHorizontalCenter();
  commands.group();
  const group = selection.items[0];
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
    } else {
      buff = [...buff, ...findText(node)];
    }
  });

  return buff;
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
  const labels = findText(rootNode).map((childNode, index) => {
    return createLabel(selection, childNode, `${index + 1}`);
  });
  selection.items = labels;
  commands.group();
  const group = selection.items[0];
  group.name = "__NUMBERED__";
  selection.items = currentSelection;
}

module.exports = {
  commands: {
    main: main
  }
};
