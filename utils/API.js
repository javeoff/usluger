export default class API {
    constructor() {
        this.url = "http://localhost:1001"
    }

    get Link() {
        return this.url
    }

    POST (query, headers) {
        return fetch(this.url + query, {method: "POST", headers})
    }

    BODY (query, body) {
        return fetch(this.url + query, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        })
    }

    addFile (query, file, params) {
        const fileData = new FormData()
        fileData.append('file', file)

        return fetch(this.url + query, {
            method: "POST",
            headers: params,
            body: fileData
        })
    }

    addFiles (query, data) {
        const fileData = new FormData()
        for (let key in data) {
            fileData.append(key, data[key])
        }

        return fetch(this.url + query, {
            method: "POST",
            body: fileData
        })
    }

    GET (query, params) {
        return fetch(this.url + query + '?' +new URLSearchParams(params).toString())
    }
}