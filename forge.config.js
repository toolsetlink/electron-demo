module.exports = {
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'toolsetlink',
                    name: 'electron-demo'
                },
                prerelease: false,
                draft: true
            }
        }
    ]
}
