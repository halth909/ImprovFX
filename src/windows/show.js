const transitionDuration = 1000; // milliseconds

const milliseconds = (milliseconds) => {
    return new Promise(async(resolve) => {
        setTimeout(_ => {
            resolve();
        }, milliseconds);
    })
}

const animationFrame = _ => {
    return new Promise(async(resolve) => {
        requestAnimationFrame(_ => {
            resolve();
        });
    })
}

let actionHandlerFactory = {
    fabricate: _ => {
        let busy = false;
        let actionBuffer = null;

        async function tryProcessAction() {
            if (busy) {
                return;
            }

            if (actionBuffer === null) {
                return;
            }

            busy = true;

            let preparedAction = actionBuffer.action(actionBuffer.options);
            actionBuffer = null;

            await preparedAction;

            busy = false;

            tryProcessAction();
        }

        let _public = {};

        _public.addAction = (actionData) => {
            console.log(actionData);

            actionBuffer = actionData;
            tryProcessAction()
        };

        return _public;
    }
}

function hide({ query, instant = false }) {
    return new Promise(async resolve => {
        if (instant) {
            $(query).remove();
            return resolve();
        }

        $(query).addClass('animated');
        $(query).addClass('hidden');

        if ($(query).length > 0) {
            await milliseconds(transitionDuration / 2);
        }

        $(query).remove();

        resolve();
    });
}

function show({ query, instant = false }) {
    return new Promise(async resolve => {
        if (instant) {
            $(query).removeClass('hidden');
            return resolve();
        }

        await animationFrame();
        await animationFrame();

        $(query).addClass('animated');

        $(query).removeClass('hidden');

        await milliseconds(transitionDuration / 2);

        resolve();
    });
}

function transitionToImage({ imagePath }) {
    return new Promise(async resolve => {
        if (imagePath == null) {
            await hide({ query: 'img' });
            return resolve();
        }

        await hide({ query: '.media-item, .text-item' });

        $('body').append($.parseHTML(`
            <img class="media-item hidden" src="${imagePath}">
        `));

        await show({ query: '.media-item' });

        resolve();
    });
}

function transitionToVideo({ videoPath, instant = true }) {
    return new Promise(async resolve => {
        if (videoPath == null) {
            await hide({ query: 'video', instant });
            return resolve();
        }

        await hide({ query: '.media-item, .text-item' });

        $('body').append($.parseHTML(`
            <video class="media-item hidden" src="${videoPath}" autoplay>
        `));

        await show({
            query: '.media-item',
            instant
        });

        $('.media-item').on('timeupdate', event => {
            let current = event.target.currentTime;

            if (isNaN(current)) {
                return;
            }

            let target = event.target.duration;

            if (instant) {
                target -= transitionDuration / 2000;
            }

            if (isNaN(target) || current < target) {
                return;
            }

            hide({
                query: '.media-item',
                instant: true
            });
        });

        resolve();
    });
}

function transitionToText({ html }) {
    return new Promise(async resolve => {
        await hide({ query: '.text-item' });

        if (html == null) {
            return resolve();
        }

        $('body').append($.parseHTML(`
            <div class="text-item hidden">
                ${html}
            </div>
        `));

        await show({ query: '.text-item' });

        resolve();
    });
}

const backgroundActionHandler = actionHandlerFactory.fabricate();
const foregroundActionHandler = actionHandlerFactory.fabricate();

function showImage(imagePath) {
    console.log('showing image');

    backgroundActionHandler.addAction({
        action: transitionToImage,
        options: { imagePath }
    });
};

function playVideo(videoPath, instant = true) {
    console.log('playing video');

    backgroundActionHandler.addAction({
        action: transitionToVideo,
        options: {
            videoPath,
            instant
        }
    });
}

function showText(md) {
    console.log('showing text');

    let converter = new showdown.Converter();
    let html = converter.makeHtml(md);
    console.log(html);
    foregroundActionHandler.addAction({
        action: transitionToText,
        options: { html }
    });
}

function useFont(fontPath) {
    if ($('#custom-font').length == 0) {
        $("head").append(`
            <style id="custom-font"></style>
        `);
    }

    $('#custom-font').html(`
        @font-face { font-family: CustomFont; src: url('${decodeURI(fontPath).replaceAll ('\\', '/')}'); } 
    `);
}

function scaleText(scale) {
    if ($('#scale-text').length == 0) {
        $("head").append(`
            <style id="scale-text"></style>
        `);
    }

    let presets = [
        ['h1', 16],
        ['h2', 12],
        ['h3', 10.4],
        ['h4', 8],
        ['h5', 6.4],
        ['h6', 5.6],
        ['p', 8],
    ];

    let rules = "";

    for (let i in presets) {
        let preset = presets[i];
        let size = preset[1] * scale;
        rules = `${rules}${preset[0]} { font-size: min(${size}vw, ${size}vh); }`;
    }

    $('#scale-text').html(rules);
}

function clear(type) {
    console.log(`clearing ${type}`);

    if (type == 'video') {
        playVideo(null, false);
    } else if (type == 'text') {
        showText();
    } else if (type == 'image') {
        showImage();
    } else {
        playVideo(null, false);
        showText();
        showImage();
    }
}

async function init() {
    api.onShowImage(showImage);
    api.onPlayVideo(playVideo);
    api.onShowText(showText);
    api.onUseFont(useFont);
    api.onScaleText(scaleText);
    api.onClear(clear);

    api.sendMessage('getConfig');
}

window.onload = _ => {
    init();
}