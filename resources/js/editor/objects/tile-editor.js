/*global Image, GraalLevelConverter */
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
        canvasObjects.rootTilesetContext = rootTileContext;
        rootTileContext.drawImage(tilesetImage, 0, 0);
    }

    function displayActiveBoard(boardText, importType) {
        var
                boardConverter,
                boardWidth,
                boardHeight,
                rootBoardContext,
                activeBoardContext;
        if (!tilesetImage || !boardObject.tilesets.activeTileset) {
            throw new Error('Please select a tileset first!');
        }
        if (!canvasObjects.rootBoardCanvas) {
            throw new Error('Unable to load board because board-canvas isn\'t defined!');
        }
        if (importType === 'GRAAL') {
            boardConverter = new GraalLevelConverter();
        } else {
            throw new Error('Unknown board type "' + importType + '"');
        }
        rootBoardContext = canvasObjects.rootBoardContext;
        if (rootBoardContext) {
            rootBoardContext.clearRect(
                    0,
                    0,
                    canvasObjects.rootBoardCanvas.width(),
                    canvasObjects.rootBoardCanvas.height()
                    );
        }
        boardObject.board = boardConverter.convertToEditorBoard(boardText);
        boardObject.tileSize = boardConverter.getTileSize();

        if (!boardObject.board) {
            throw new Error('Received empty board from converter. Please investigate');
        }

        boardWidth = boardConverter.getMaximumBoardWidth();
        boardHeight = boardConverter.getMaximumBoardHeight();

        resizeCanvasElement(canvasObjects.rootBoardCanvas, boardWidth, boardHeight);
        resizeCanvasElement(canvasObjects.activeBoardCanvas, boardWidth, boardHeight);

        rootBoardContext = canvasObjects.rootBoardCanvas[0].getContext('2d');
        activeBoardContext = canvasObjects.activeBoardCanvas[0].getContext('2d');

        canvasObjects.rootBoardContext = rootBoardContext;
        canvasObjects.activeBoardContext = activeBoardContext;

        canvasObjects.activeBoardCanvas.on('mousemove', function (e) {
            var tileXY = getTileXYFromCoords(this, e, boardObject.tileSize);
            $('.info.active-tile-coord').text('(' + tileXY[0] + ', ' + tileXY[1] + ')');
        });
        canvasObjects.activeBoardCanvas.on('mousedown', function (e) {
            var tileXY = getTileXYFromCoords(this, e, boardObject.tileSize);
            canvasObjects.activeBoardContext.clearRect(0, 0, canvasObjects.activeBoardCanvas.width(), canvasObjects.activeBoardCanvas.height());
            canvasObjects.activeBoardContext.rect(
                    tileXY[0] * boardObject.tileSize,
                    tileXY[1] * boardObject.tileSize,
                    boardObject.tileSize,
                    boardObject.tileSize
                    );
            canvasObjects.activeBoardContext.stroke();
            boardObject.activeSelection = {};
            boardObject.activeSelection.start = tileXY;
            console.log("Active selection: " + boardObject.activeSelection.start[0] + ", " + boardObject.activeSelection.start[1]);
        });
        canvasObjects.activeBoardCanvas.on('mouseup', function (e) {
            var tileXY = getTileXYFromCoords(this, e, boardObject.tileSize);
            console.log("End Selection @: " + tileXY[0] + ", " + tileXY[1]);
            if (tileXY[0] === boardObject.activeSelection.start[0]
                    && tileXY[1] === boardObject.activeSelection.start[1]) {
                console.log("You didnt do shit!");
            } else {
                console.log("You went from place A to place B!");
            }
        });
        renderBoardCanvas();
    }

    function getTileXYFromCoords(container, event, tileSize) {
        var offset, mouseX, mouseY, tileX, tileY;
        offset = $(container).offset();
        mouseX = event.pageX - offset.left;
        mouseY = event.pageY - offset.top;
        tileX = Math.floor(mouseX / tileSize);
        tileY = Math.floor(mouseY / tileSize);

        return [tileX, tileY];
    }

    function renderBoardCanvas() {
        if (!boardObject.board) {
            throw new Error('Unable to render board canvas, no board is defined.');
        }
        var drawX, drawY, rowNumber, colNumber;
        for (rowNumber in boardObject.board) {
            drawY = rowNumber * boardObject.tileSize;

            for (colNumber in boardObject.board[rowNumber].tiles) {
                drawX = colNumber * boardObject.tileSize;
                canvasObjects.rootBoardContext.drawImage(
                        tilesetImage,
                        boardObject.board[rowNumber].tiles[colNumber][0],
                        boardObject.board[rowNumber].tiles[colNumber][1],
                        boardObject.tileSize,
                        boardObject.tileSize,
                        drawX,
                        drawY,
                        boardObject.tileSize,
                        boardObject.tileSize
                        );
            }
        }
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
        loadBoardObject: function (boardText, importType) {
            if (!initialized) {
                throw new Error('Tile editor needs to be initialized first!');
            }
            displayActiveBoard(boardText, importType);
        }
    };
}());

com.javecross.editor.WebEditor.DEFAULT_TILESET = 'resources/images/seilius_tileset5.png';
com.javecross.editor.WebEditor.DEFAULT_LEVEL = 'resources/other/seilius_comboshop.nw';