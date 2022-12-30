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

const transitionDuration = 5000; // milliseconds

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

function fadeOut({ query }) {
    return new Promise(async resolve => {
        $(query).addClass('hidden');

        if ($(query).length > 0) {
            await milliseconds(transitionDuration / 2);
        }

        $(query).remove();

        resolve();
    });
}

function fadeIn({ query }) {
    return new Promise(async resolve => {
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
        await fadeOut({ query: '.media-item' });

        $('body').append($.parseHTML(`
            <img class="media-item hidden" src="${imagePath}">
        `));

        await fadeIn({ query: '.media-item' });

        resolve();
    });
}

function transitionToVideo({ videoPath }) {
    return new Promise(async resolve => {
        await fadeOut({ query: '.media-item' });

        $('body').append($.parseHTML(`
            <video class="media-item hidden" src="${videoPath}" autoplay>
        `));

        await fadeIn({ query: '.media-item' });

        $('.media-item').on('timeupdate', event => {
            let current = event.target.currentTime;

            if (isNaN(current)) {
                return;
            }

            let target = event.target.duration - transitionDuration / 2000;

            if (isNaN(target) || current < target) {
                return;
            }

            fadeOut({ query: '.media-item' });
        });

        resolve();
    });
}

function transitionToText({ html }) {
    return new Promise(async resolve => {
        await fadeOut({ query: '.text-item' });

        $('body').append($.parseHTML(`
            <div class="text-item hidden">
                ${html}
            </div>
        `));

        await fadeIn({ query: '.text-item' });

        resolve();
    });
}

async function init() {
    let backgroundActionHandler = actionHandlerFactory.fabricate();
    let foregroundActionHandler = actionHandlerFactory.fabricate();

    api.onShowImage((imagePath) => {
        console.log('showing image');

        backgroundActionHandler.addAction({
            action: transitionToImage,
            options: { imagePath }
        });
    });

    api.onPlayVideo((videoPath) => {
        console.log('playing video');

        backgroundActionHandler.addAction({
            action: transitionToVideo,
            options: { videoPath }
        });
    });

    api.onShowText((md) => {
        console.log('showing text');

        let converter = new showdown.Converter();
        let html = converter.makeHtml(md);
        console.log(html);
        foregroundActionHandler.addAction({
            action: transitionToText,
            options: { html }
        });
    });

    api.onClear(type => {
        console.log('clearing all');

        if (type !== 'text') {
            backgroundActionHandler.addAction({
                action: fadeOut,
                options: { query: '.media-item' }
            });
        }

        if (type !== 'media') {
            foregroundActionHandler.addAction({
                action: fadeOut,
                options: { query: '.text-item' }
            });
        }
    });

    api.sendMessage('getConfig');
}

window.onload = _ => {
    init();
}