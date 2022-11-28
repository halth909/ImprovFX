const ipc = require('electron').ipcRenderer;

ipc.on('asynchronous-message', function(evt, message) {
    console.log(message);
});

async function init() {
    $(document).on('click', '.sfx-button', function() {
        console.log(this);
        new Howl({ src: [$(this).attr('url')] }).play()
    });

    let $sfxDirectory = $('#sfx-directory');
    let $sfxButtonContainer = $('#sfx-button-container');

    $sfxDirectory.on('change', function(e) {
        $sfxButtonContainer.empty();

        const files = this.files;

        for (let i = 0; i < files.length; i++) {
            let file = files.item(i);
            console.log(file.name);
            $sfxButtonContainer.append($.parseHTML(`
                <button class="sfx-button" url='${file.path}'>${file.name}</button>
            `));
        }
    });

    console.log($sfxDirectory);
}

$(document).ready(() => {
    init();
});