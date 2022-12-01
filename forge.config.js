module.exports = {
    packagerConfig: {},
    rebuildConfig: {},
    makers: [{
            name: '@electron-forge/maker-squirrel',
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    plugins: [{
        name: '@electron-forge/plugin-webpack',
        config: {
            mainConfig: './webpack.main.config.js',
            renderer: {
                config: './webpack.renderer.config.js',
                entryPoints: [{
                        html: './windows/controls.html',
                        js: './windows/controls.js',
                        name: 'main_window',
                        preload: {
                            js: './preload.js',
                        }
                    },
                    {
                        html: './windows/show.html',
                        js: './windows/show.js',
                        name: 'main_window',
                        preload: {
                            js: './preload.js',
                        }
                    }
                ],
            },
        }
    }]
}