/*global Image */
/*eslint-env browser */
/*eslint no-console:0 */

var com;
if (!com || !com.javecross || !com.javecross.editor) {
    throw new Error('The global namespace hasn\'t been defined!');
}

com.javecross.editor.WebEditor = (function () {
    'use strict';
    var
            tilesetImage,
            initialized = false,
            canvasObjects = {},
            editorOptions = {},
            boardObject = {};

    /*
     * Resize the given canvas element. Try not to do this too often, canvas gets cranky!
     *
     * @param {jQuery Obj} canvasElement The element to resize
     * @param {int} newWidth the new width
     * @param {int} newHeight the new height
     */
    function resizeCanvasElement(canvasElement, newWidth, newHeight) {
        // Set the jQuery element, changes the css style.
        canvasElement.width(newWidth);
        canvasElement.height(newHeight);
        // Set the HTML element, changes the physical canvas.
        canvasElement[0].width = newWidth;
        canvasElement[0].height = newHeight;
    }

    function displayActiveTileset() {
        if (!canvasObjects.rootTilesetCanvas) {
            throw new Error('Unable to load tileset because canvas isn\'t defined.');
        }
        if (!tilesetImage) {
            throw new Error('Unable to display tileset, tileset undefined!');
        }
        var
                rootTileContext = canvasObjects.rootTilesetContext,
                tilesetWidth = tilesetImage.width,
                tilesetHeight = tilesetImage.height;

        if (rootTileContext) {
            rootTileContext.clearRect(
                    0,
                    0,
                    canvasObjects.rootTilesetCanvas.width(),
                    canvasObjects.rootTilesetCanvas.height()
                    );
        }
        resizeCanvasElement(canvasObjects.rootTilesetCanvas, tilesetWidth, tilesetHeight);
        resizeCanvasElement(canvasObjects.activeTilesetCanvas, tilesetWidth, tilesetHeight);

        rootTileContext = canvasObjects.rootTilesetCanvas[0].getContext('2d');
        canvasObjects.activeTilesetCanvas.hide();
        rootTileContext.drawImage(tilesetImage, 0, 0);
    }

    function initializeCanvasObjects(inputSettings) {
        var errorMsg = [];
        if (!inputSettings.rootBoardCanvas) {
            errorMsg.push('Root board canvas needs to be defined!');
        }
        if (!inputSettings.activeBoardCanvas) {
            errorMsg.push('Active board canvas needs to be defined!');
        }
        if (!inputSettings.rootTilesetCanvas) {
            errorMsg.push('Root tileset canvas needs to be defined!');
        }
        if (!inputSettings.activeTilesetCanvas) {
            errorMsg.push('Active tileset canvas needs to be defined');
        }
        if (errorMsg.length > 0) {
            for (var err in errorMsg) {
                console.log(err);
            }
            throw new Error('Unable to initialize, canvas elements not defined');
        }
        canvasObjects.rootBoardCanvas = inputSettings.rootBoardCanvas;
        canvasObjects.activeBoardCanvas = inputSettings.activeBoardCanvas;

        canvasObjects.rootTilesetCanvas = inputSettings.rootTilesetCanvas;
        canvasObjects.activeTilesetCanvas = inputSettings.activeTilesetCanvas;
    }

    function initializeBoardObject() {
        boardObject = {};
        boardObject.tilesets = {};
        boardObject.board = {};
        boardObject.scripts = {};
        boardObject.joins = {};
    }

    return {
        initializeWebTileEditor: function (inputSettings) {
            if (!inputSettings) {
                throw new Error('Editor options haven\'t been defined!');
            }
            // Initialize Canvas
            initializeCanvasObjects(inputSettings);
            // Initialize editor options.
            editorOptions.tileSize = inputSettings.tileSize;
            initializeBoardObject();
            initialized = true;
        },
        loadTilesetImage: function (tilesetString) {
            if (!initialized) {
                throw new Error('Tile editor needs to be initialized first');
            }
            tilesetImage = new Image();
            tilesetImage.onload = function () {
                displayActiveTileset();
            };
            tilesetImage.src = tilesetString;
            boardObject.tilesets.activeTileset = tilesetString;
        },
        loadBoardObject: function (boardFile, importType) {
            if (!initialized) {
                throw new Error('Tile editor needs to be initialized first!');
            }

        }
    };
}());

com.javecross.editor.WebEditor.DEFAULT_TILESET = 'resources/images/seilius_tileset5.png';
com.javecross.editor.WebEditor.DEFAULT_LEVEL = '/resources/other/seilius_comboshop.nw';