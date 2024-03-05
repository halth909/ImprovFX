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

const settings = (_ => {
    let values = { 
        default_fade: 1000, // milliseconds
        video_loop: false
    };

    let _public = {};

    _public.set = new_values => {
        values = {
            ...values,
            ...new_values
        };

        if ($('#transitions-properties').length == 0) {
            $("head").append(`
                <style id="transitions-properties"></style>
            `);
        }
    
        $('#transitions-properties').html(`
            :root {
                --image-in: ${values.image_in}ms;
                --image-out: ${values.image_out}ms;
                --text-in: ${values.text_in}ms;
                --text-out: ${values.text_out}ms;
                --video-in: ${values.video_in}ms;
                --video-out: ${values.video_out}ms;
            }
        `);
    }

    _public.get = query => {
        if (query in values) {
            return values[query];
        }

        let map = {

        };
    
        if (query in map) {
            let key = map[query];
            if (key in values) {
                return values[key];
            }
        }

        return values.default_fade;
    }; 

    return _public;
})();

const types = (_ => {
    let _public = {};

    _public.toQuery = list => {
        let map = {
            'image': 'img',
            'text': '.text-item',
            'video': 'video'
        }

        let queryParts = [];

        for (let item of list) {
            console.log (item);
            if (item in map) {
                console.log('in map');
                queryParts.push (map[item]);
            }
        }

        return queryParts.join(", ");
    };

    _public.inDuration = list => {
        return durationFromList({
            list, suffix: "in"
        });
    };

    _public.outDuration = list => {
        return durationFromList({
            list, suffix: "out"
        });
    };

    function durationFromList({ list, suffix }) {
        if (list.length == 0) {
            return settings.get('default_fade');
        }

        let max = 0;

        for (let item of list) {
            max = Math.max(max, settings.get(`${item}_${suffix}`));
        }

        return max;
    }

    return _public;
})();

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

function hide({ typeList }) {
    let query = types.toQuery(typeList);
    let transitionDuration = types.outDuration(typeList);

    return new Promise(async resolve => {
        if (transitionDuration == 0) {
            $(query).remove();
            return resolve();
        }

        $(query).addClass('animated');
        $(query).addClass('hidden');

        // don't fade if no items exist
        if ($(query).length > 0) {
            await milliseconds(transitionDuration);
        }

        $(query).remove();

        resolve();
    });
}

function hideAll() {
    return new Promise(async resolve => {
        await hide({ typeList: ['image', 'video', 'text'] });
        resolve();
    });
}

function show({ typeList }) {
    let query = types.toQuery(typeList);
    let transitionDuration = types.inDuration(typeList);

    return new Promise(async resolve => {
        if (transitionDuration == 0) {
            $(query).removeClass('hidden');
            return resolve();
        }

        await animationFrame();
        await animationFrame();

        $(query).addClass('animated');
        $(query).removeClass('hidden');

        await milliseconds(transitionDuration);

        resolve();
    });
}

function transitionToImage({ imagePath }) {
    return new Promise(async resolve => {
        if (imagePath == null) {
            await hide({ typeList: ['image'] });
            return resolve();
        }

        await hide({ typeList: ['image', 'video'] });

        $('body').append($.parseHTML(`
            <img class="image-item hidden" src="${imagePath}">
        `));

        await show({ typeList: ['image'] });

        resolve();
    });
}

function transitionToVideo({ videoPath }) {
    return new Promise(async resolve => {
        if (videoPath == null) {
            await hide({ typeList: ['video'] });
            return resolve();
        }

        await hide({ typeList: ['image', 'video'] });

        $('body').append($.parseHTML(`
            <video class="video-item hidden" src="${videoPath}" autoplay>
        `));

        if (settings.get('video_loop')) {
            $('video').attr('loop', 'loop');
        }
        
        else {
            $('video').removeAttr('loop');
        }
        
        await show({ typeList: ['video'] });

        $('.video-item').on('timeupdate', event => {
            let current = event.target.currentTime;

            if (isNaN(current)) {
                return;
            }

            let transitionDuration = types.outDuration(['video']);
            let target = event.target.duration - transitionDuration / 1000;

            console.log (`${current} ${target}`);

            if (isNaN(target) || current < target) {
                return;
            }

            hide({ typeList: ['video'] });
        });

        resolve();
    });
}

function transitionToText({ html }) {
    return new Promise(async resolve => {
        await hide({ typeList: ['text'] });

        if (html == null) {
            return resolve();
        }

        $('body').append($.parseHTML(`
            <div class="text-item hidden">
                ${html}
            </div>
        `));

        await show({ typeList: ['text'] });

        resolve();
    });
}

const backgroundActionHandler = actionHandlerFactory.fabricate();
const foregroundActionHandler = actionHandlerFactory.fabricate();

function updateSettings(payload) {
    settings.set(payload);
}

function showImage(imagePath) {
    console.log('showing image');

    backgroundActionHandler.addAction({
        action: transitionToImage,
        options: { imagePath }
    });
};

function playVideo(videoPath) {
    console.log('playing video');

    backgroundActionHandler.addAction({
        action: transitionToVideo,
        options: {
            videoPath
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

function loopVideo(loop) {
    console.log (loop);

    if (loop) {
        $('video').attr('loop', 'loop');
    }
    
    else {
        $('video').removeAttr('loop');
    }

    settings.set({ 'video_loop': loop });
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
    api.onUpdateSettings(updateSettings);
    api.onShowImage(showImage);
    api.onPlayVideo(playVideo);
    api.onShowText(showText);
    api.onLoopVideo(loopVideo);
    api.onUseFont(useFont);
    api.onScaleText(scaleText);
    api.onClear(clear);

    api.sendMessage('getConfig');
}

window.onload = _ => {
    init();
}