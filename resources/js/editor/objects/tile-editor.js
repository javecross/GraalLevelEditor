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
        boardObject = {},
        lastSelectionDrawTime = -1;

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
        var rootTileContext = canvasObjects.rootTilesetContext,
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

    function clearActiveSelection() {
        boardObject.activeSelection = {};
        canvasObjects.activeBoardContext.clearRect(
            0,
            0,
            canvasObjects.activeBoardCanvas.width(),
            canvasObjects.activeBoardCanvas.height()
            );
    }

    function drawActiveSelection(initialTile, endTile) {
        var initialx = initialTile[0] * boardObject.tileSize,
            initialy = initialTile[1] * boardObject.tileSize,
            width,
            height,
            deltax = 1,
            deltay = 1;
        canvasObjects.activeBoardContext.clearRect(
            0,
            0,
            canvasObjects.activeBoardCanvas.width(),
            canvasObjects.activeBoardCanvas.height()
            );
        if (endTile[0] < initialTile[0]) {
            initialx += boardObject.tileSize;
            deltax = -1;
        }
        if (endTile[1] < initialTile[1]) {
            initialy += boardObject.tileSize;
            deltay = -1;
        }
        width = deltax * boardObject.tileSize + (endTile[0] - initialTile[0]) * boardObject.tileSize;
        height = deltay * boardObject.tileSize + (endTile[1] - initialTile[1]) * boardObject.tileSize;

        canvasObjects.activeBoardContext.beginPath();
        canvasObjects.activeBoardContext.rect(
            initialx,
            initialy,
            width,
            height
            );
        canvasObjects.activeBoardContext.stroke();
    }

    function mouseInActiveArea(mouseTile) {
        var maxx, maxy, minx, miny;
        if (!boardObject.activeSelection
            || !boardObject.activeSelection.start
            || !boardObject.activeSelection.end
            ) {
            return false;
        }
        maxx = Math.max(
            boardObject.activeSelection.start[0],
            boardObject.activeSelection.end[0]
            );
        minx = Math.min(
            boardObject.activeSelection.start[0],
            boardObject.activeSelection.end[0]
            );
        maxy = Math.max(
            boardObject.activeSelection.start[1],
            boardObject.activeSelection.end[1]
            );
        miny = Math.min(
            boardObject.activeSelection.start[1],
            boardObject.activeSelection.end[1]
            );
        if (mouseTile[0] >= minx
            && mouseTile[0] <= maxx
            && mouseTile[1] >= miny
            && mouseTile[1] <= maxy
            ) {
            return true;
        }
        return false;
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
            var tileXY = getTileXYFromCoords(this, e, boardObject.tileSize),
                inActiveArea = mouseInActiveArea(tileXY);
            $('.info.active-tile-coord').text('(' + tileXY[0] + ', ' + tileXY[1] + ')');

            if (!boardObject.mouseDown && inActiveArea) {
                $(this).css('cursor', 'grab');
            } else if (boardObject.mouseDown) {
                if (boardObject.grabbing) {
                    $(this).css('cursor', 'grabbing');
                } else {
                    $(this).css('cursor', 'auto');
                    if (
                        Date.now() - lastSelectionDrawTime
                        > com.javecross.editor.WebEditor.SELECTION_UPDATE_INTERVAL
                        ) {
                        lastSelectionDrawTime = Date.now();
                        drawActiveSelection(boardObject.activeSelection.start, tileXY);
                    }
                }
            } else {
                $(this).css('cursor', 'auto');
            }
            /*
             if (!inActiveArea) {
             $(this).css('cursor', 'auto');
             if (boardObject.mouseDown) {
             if (
             Date.now() - lastSelectionDrawTime
             > com.javecross.editor.WebEditor.SELECTION_UPDATE_INTERVAL
             ) {
             lastSelectionDrawTime = Date.now();
             drawActiveSelection(boardObject.activeSelection.start, tileXY);
             }
             }
             } else {
             if (boardObject.mouseDown) {
             $(this).css('cursor', 'grabbing');
             } else {
             $(this).css('cursor', 'grab');
             }
             }
             */
        });
        canvasObjects.activeBoardCanvas.on('mousedown', function (e) {
            var tileXY = getTileXYFromCoords(this, e, boardObject.tileSize);
            boardObject.mouseDown = true;

            if (mouseInActiveArea(tileXY)) {
                $(canvasObjects.activeBoardCanvas).css('cursor', 'grabbing');
                boardObject.grabbing = true;
                boardObject.activeSelection.translationTile = tileXY;
                return;
            }
            drawActiveSelection(tileXY, tileXY);
            boardObject.activeSelection = {};
            boardObject.activeSelection.start = tileXY;
            boardObject.activeSelection.startMouse = [e.pageX, e.pageY];
            console.log(
                "Active selection: "
                + boardObject.activeSelection.start[0]
                + ", "
                + boardObject.activeSelection.start[1]
                );
        });
        canvasObjects.activeBoardCanvas.on('mouseup', function (e) {
            var tileXY = getTileXYFromCoords(this, e, boardObject.tileSize);
            $(canvasObjects.activeBoardCanvas).css('cursor', 'auto');
            boardObject.mouseDown = false;
            if (!boardObject.activeSelection) {
                return;
            }
            if (boardObject.grabbing) {
                // The user was dragging the active selection around, and is now done.
                boardObject.grabbing = false;
                console.log(
                    'translate active area from: '
                    + boardObject.activeSelection.translationTile[0]
                    + ', '
                    + boardObject.activeSelection.translationTile[1]
                    + ' to '
                    + tileXY[0]
                    + ', '
                    + tileXY[1]
                    );
                return;
            }
            if (tileXY[0] !== boardObject.activeSelection.start[0]
                && tileXY[1] !== boardObject.activeSelection.start[1]) {
                boardObject.activeSelection.end = tileXY;
            } else {
                if (e.pageX === boardObject.activeSelection.startMouse[0]
                    && e.pageY === boardObject.activeSelection.startMouse[1]) {
                    // User didn't move the mouse at all!
                    clearActiveSelection();
                }
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
com.javecross.editor.WebEditor.SELECTION_UPDATE_INTERVAL = 25;