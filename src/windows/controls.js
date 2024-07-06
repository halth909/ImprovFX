const settings = (_ => {
    let min = 0;
    let max = 5000;

    let defaults = {
        audio_in: 0,
        audio_out: 1000,
        image_in: 500,
        image_out: 500,
        text_in: 500,
        text_out: 500,
        video_in: 500,
        video_out: 500
    };

    let _public = {};

    _public.values = {
        ...defaults
    };

    _public.init = _ => {
        for (let key in defaults) {
            let id = key.replace("_", "-");
            let label = key.charAt(0).toUpperCase() + key.replace("_", " ").slice(1);
            let val = defaults[key];

            api.sendMessage('settingsChanged', _public.values);

            $("#fade-panel").append(`
                <div class="slider-container">
                    <label class="settings-label" for="${id}">${label}</label>
                    <input type="range" min="${min}" max="${max}" value="${val}" class="slider" id="${id}">
                    <p class="settings-value" id="${id}-value">${val}ms</p>
                </div>
            `);

            $(document).on('input', `#${id}`, event => {
                let value = parseInt($(`#${id}`).val());
                _public.values[key] = value;
                $(`#${id}-value`).html(`${value}ms`);
                api.sendMessage('settingsChanged', _public.values);
            });
        }
    }

    return _public;
})();

const audio = (_ => {
    let player = null;
    let cancelTimeoutId = null;

    let progressTimeoutId = null;
    let maxProgress = 0;

    let _public = {};

    _public.play = src => {
        if (player) {
            player.stop();
        }

        if (cancelTimeoutId) {
            clearTimeout(cancelTimeoutId);
        }

        player = new Howl({ src });
        player.play();

        if (settings.values.audio_in > 0) {
            player.fade(0, 1, settings.values.audio_in);
        }

        trackProgress();
    }

    _public.cancel = _ => {
        console.log(player);
        if (!player) {
            return;
        }

        player.fade(1, 0, settings.values.audio_out);

        cancelTimeoutId = setTimeout(_ => {
            if (player) {
                player.stop();
            }
        }, settings.values.audio_out);
    }

    function trackProgress() {
        if (progressTimeoutId != null) {
            clearTimeout(progressTimeoutId);
        }

        maxProgress = 0;
        updateProgress();
    }

    function updateProgress() {
        if ($('#audio-progress').length == 0) {
            $("head").append(`
                <style id="audio-progress"></style>
            `);
        }

        let audioTime = player.seek();
        let progress = 100 * audioTime / player.duration();
        audioTime = Math.floor(audioTime);

        $('#audio-progress').html(`
            :root {
                --audio-progress: ${progress}%;
                --audio-time: "${JSON.stringify(audioTime)}";
            }
        `);

        maxProgress = isNaN(progress) ? maxProgress : Math.max(progress, maxProgress);
        console.log(`${progress} ${maxProgress}`);

        if (isNaN(progress) || maxProgress == 0 || progress != 0) {
            progressTimeoutId = requestAnimationFrame(updateProgress);
        } else {
            $('.sfx-button').removeClass('playing');
        }
    }

    return _public;
})();

const details = (_ => {
    let customHistory = [];

    let _public = {};

    _public.update = _ => {
        let result = {
            "current": {}
        };

        $('input, textarea').each((index, element) => {
            console.log(index, element, $(element).val());
            result["current"][$(element).attr('id')] = $(element).val();
        });

        result["history"] = customHistory;

        api.sendMessage('detailsUpdated', JSON.stringify(result));
    }

    _public.loadHistory = (savedHistory) => {
        customHistory = savedHistory;
    }

    _public.add = ({ key, index } = {}) => {
        console.log(key, index);
        let value = "";

        if (typeof key === 'undefined') {
            key = `custom-${index}`;

            console.log(customHistory);

            if (customHistory.length > 0) {
                value = customHistory.pop();
            }
        }

        $('#add-markdown').before($.parseHTML(`
            <div class="markdown-container custom-markdown">
                <div class="markdown-header">
                    <label for="${key}">Custom Text</label>
                    <button class="remove-markdown">Remove</button>
                    <button class="markdown-show">Show</button>
                </div>
                <textarea id="${key}" class="custom-markdown__textarea" rows="4" placeholder="Custom markdown"></textarea>
            </div>
        `));

        if (value != "") {
            $(`#${key}`).val(value);
        }
    }

    _public.remove = (element) => {
        let textarea = $(element).find("textarea")[0];
        let value = textarea.value;

        if (value != "") {
            customHistory.push(value);
        }

        element.remove();

        $(".custom-markdown__textarea").each((index, element) => {
            $(element).attr("id", `#custom-${index}`);
        });

        _public.update();
    }

    return _public;
})();

const mediaButtons = (_ => {
    let buttons = [];

    let _public = {};

    _public.setup = files => {
        for (let i = 0; i < files.videos.length; i++) {
            const video = files.videos[i];
            console.log(video);

            let $element = $($.parseHTML(`
                <div class="video-button media-button" data-url="${video.url}">
                    <video class="media-preview" src="${video.url}#t=5"></video>
                    <p>${video.name}</p>
                </div>
            `));

            $('#video-buttons').append($element);

            buttons.push({
                $element: $element,
                searchTags: video.name.toLowerCase()
            });
        }

        for (let i = 0; i < files.images.length; i++) {
            const image = files.images[i];

            let $element = $($.parseHTML(`
                <div class="image-button media-button" data-url="${image.url}">
                    <img class="media-preview" src="${image.url}">
                    <p>${image.name}</p>
                </div>
            `));

            $('#image-buttons').append($element);

            buttons.push({
                $element: $element,
                searchTags: image.name.toLowerCase()
            });
        }

        for (let i = 0; i < files.sfx.length; i++) {
            const sfx = files.sfx[i];

            let $element = $($.parseHTML(`
                <button class="sfx-button" data-url="${sfx.url}">
                    <img class="play-icon" src="./assets/play.png">
                    <p class="sfx-label">${sfx.name}</p>
                    <div class="sfx-progress"></div>
                </button>
            `));

            $('#sfx-buttons').append($element);

            buttons.push({
                $element: $element,
                searchTags: sfx.name.toLowerCase()
            });
        }

        for (let i = 0; i < files.fonts.length; i++) {
            const font = files.fonts[i];

            $('#font-select').append($.parseHTML(`
                <option class="font-item" value="${encodeURI(font.url)}">
                    ${font.name}
                </options>
            `));
        }

        api.sendMessage('fontSelected', $('.font-item').first().val());
    }

    _public.search = terms => {
        terms = terms.toLowerCase().trim();
        for (let i = 0; i < buttons.length; i++) {
            console.log(buttons[i].$element);

            if (terms == "" || buttons[i].searchTags.includes(terms)) {
                buttons[i].$element.removeClass("hidden");
            } else {
                buttons[i].$element.addClass("hidden");
            }
        }
    }

    return _public;
})();

function hidePanels() {
    $('.panel-full').hide();
    $('.header-tab').removeClass('selected');
}

async function init() {
    $(document).on('click', '.header-tab', event => {
        hidePanels();

        const $target = $(event.target);
        $(`#panel-${$target.attr ('data-panel')}`).show();
        $target.addClass('selected');
    });

    $(document).on('click', '.clear', event => {
        const type = $(event.target).attr('data-type');
        console.log(`clearing ${type}`);

        switch (type) {
            case "all":
                api.sendMessage('clear', type);
                audio.cancel();
                break;
            case "sfx":
                audio.cancel();
                break;
            default:
                api.sendMessage('clear', type);
                break;
        }
    });

    // local interaction
    $(document).on('click', '.video-button', event => {
        api.sendMessage('playVideo', $(event.currentTarget).attr('data-url'));
    });

    $(document).on('input', '#text-size', event => {
        let x = $('#text-size').val();
        let exp = 5 + 0.05 * x + 0.001 * x * x;
        let val = exp / 10;
        $('#text-size-value').html(Math.round(exp) / 10);
        api.sendMessage('textScaleSet', val);
    });

    $(document).on('click', '.markdown-show', event => {
        let siblings = $(event.target).parent().siblings();
        siblings.each((index, sibling) => {
            api.sendMessage('showText', $(sibling).val());
        });
    });

    $(document).on('click', '#add-markdown', _ => {
        let index = $('.custom-markdown').length;
        details.add({ index });
    });

    $(document).on('click', '.remove-markdown', event => {
        details.remove($(event.target).closest('.markdown-container'));
    });

    $(document).on('click', '.image-button', event => {
        console.log('image clicked');
        api.sendMessage('imageClicked', $(event.currentTarget).attr('data-url'));
    });

    $(document).on('click', '.sfx-button', event => {
        $('.sfx-button').removeClass('playing');
        $(event.currentTarget).addClass('playing');
        const src = $(event.currentTarget).attr('data-url');
        audio.play(src);
    });

    $(document).on('input', '#video-loop', event => {
        console.log(event);
        api.sendMessage('videoLoop', event.currentTarget.checked);
    });

    $(document).on('input', '#font-select', event => {
        api.sendMessage('fontSelected', $(event.currentTarget).val());
    });

    $(document).on('keydown', event => {
        $(`button[data-key='${event.key.toLowerCase()}']`).click();

        // const num = parseInt(event.key);

        // if (isNaN(num)) {
        //     return;
        // }

        // if (num > $('.sfx-button').length) {
        //     return;
        // }

        // new Howl({
        //     src: [$('.sfx-button').eq(num - 1).attr('data-url')]
        // }).play();
    });

    $(document).on('keyup', 'input, textarea', _ => {
        details.update();
    });

    $(document).on('keyup', '#header-search', _ => {
        mediaButtons.search($('#header-search').val());
    });

    // api events
    api.onListFiles((files) => {
        mediaButtons.setup(files);
    });

    api.onLoadPreviousText((previousText) => {
        console.log(previousText);

        previousText = JSON.parse(previousText);

        for (const [key, value] of Object.entries(previousText["current"])) {
            let element = document.getElementById(key);

            if (element == null) {
                details.add({ key, value });
            }

            element = document.getElementById(key);

            if (value != "") {
                element.value = value;
            }
        }

        details.loadHistory(previousText["history"]);
    });

    // request media files
    api.sendMessage('getFiles');

    settings.init();

    document.getElementsByClassName('header-tab')[0].click();
}

window.onload = _ => {
    init();
}