import { AdminWebsocket, AgentPubKey, AppWebsocket, CapSecret } from '@holochain/conductor-api'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import { execHolochain } from '@holochain-open-dev/holochain-run-dna/src/execHolochain'
import { rootPath } from 'electron-root-path'
import fs from 'fs'


export const fakeCapSecret = (): CapSecret => Buffer.from(Array(64).fill('aa').join(''), 'hex')

export class Dna {
    file: Buffer
    nick: string
}
export default class HolochainLanguageDelegate {
    #languageHash
    #holochainService

    constructor(languageHash: String, holochainService: HolochainService) {
        this.#languageHash = languageHash
        this.#holochainService = holochainService
    }

    registerDNAs(dnas: Array<Dna>) {
        this.#holochainService.ensureInstallDNAforLanguage(this.#languageHash, dnas)
    }

    async call(dnaNick: String, zome_name: string, fn_name: String, params: object|string): Promise<any> {
        return this.#holochainService.callZomeFunction(this.#languageHash, dnaNick, zome_name, fn_name, params)
    }
}

export class HolochainService {
    #db: any
    #adminPort: number
    #appPort: number
    #adminWebsocket: AdminWebsocket
    #appWebsocket: AppWebsocket
    #dataPath: string
    #ready: Promise<void>

    constructor(dbAdapter, configPath, dataPath) {
        let resolveReady
        this.#ready = new Promise(resolve => resolveReady = resolve)

        this.#dataPath = dataPath
        this.#db = low(dbAdapter)
        this.#db.defaults({pubKeys: []}).write()

        const holochainAdminPort = 1337
        process.env.PATH = `${rootPath}:${process.env.PATH}`
        execHolochain(holochainAdminPort, configPath).then(async result => {
            try {
                this.#adminPort = result[1]
                this.#adminWebsocket = await AdminWebsocket.connect(
                    `ws://localhost:${this.#adminPort}`
                )
    
                console.debug("Holochain admin interface connected on port", this.#adminPort)
                this.#appPort = this.#adminPort + 1
                this.#adminWebsocket.attachAppInterface({ port: this.#appPort })
                this.#appWebsocket = await AppWebsocket.connect(`ws://localhost:${this.#appPort}`)
                console.debug("Holochain app interface connected on port", this.#appPort)
                resolveReady()
            } catch(e) {
                console.error("Error intializing Holochain conductor:", e)
            }
            
        })
    }

    async pubKeyForLanguage(lang: string): Promise<AgentPubKey> {
        const alreadyExisting = this.#db.get('pubKeys').find({lang}).value()
        if(alreadyExisting) {
            console.debug("Found existing pubKey entry", alreadyExisting, "for language:", lang)
            const pubKey = Buffer.from(alreadyExisting.pubKey.data)
            console.debug("Found existing pubKey", pubKey, "for language:", lang)
            return pubKey
        } else {
            const pubKey = await this.#adminWebsocket.generateAgentPubKey()
            this.#db.get('pubKeys').push({lang, pubKey}).write()
            console.debug("Created new pubKey", pubKey, "for language", lang)
            return pubKey
        }
    }

    async ensureInstallDNAforLanguage(lang: string, dnas: Array<Dna>) {
        await this.#ready
        let installed

        // 1. install app
        try {
            console.debug("HolochainService: Installing DNAs for language", lang)
            //console.debug(dnaFile)
            //let installedCellIds = await this.#adminWebsocket.listCellIds()
            //console.debug("HolochainService: Installed cells before:", installedCellIds)
            //const cellId = HolochainService.dnaID(lang, nick)

            await this.#adminWebsocket.installApp({
                agent_key: await this.pubKeyForLanguage(lang),
                installed_app_id: lang,
                dnas: dnas.map((dna) => {
                    const p = path.join(this.#dataPath, `${lang}-${dna.nick}.dna.gz`)
                    fs.writeFileSync(p, dna.file)
                    return { nick: dna.nick, path: p };
                }),    
            })
    
            //installedCellIds = await this.#adminWebsocket.listCellIds()
            //console.debug("HolochainService: Installed cells after:", installedCellIds)
            installed = true
        } catch(e) {
            if(!e.data?.data?.indexOf('AppAlreadyInstalled')) {
                console.error("Error during install of DNA:", e)
                installed = false
            } else {
                console.debug("HolochainService: App", lang, "already installed")
                installed = true
            }
        }

        if(!installed)
            return

        // 2. activate app
        try {
            await this.#adminWebsocket.activateApp({installed_app_id: lang})
        } catch(e) {
            console.error("HolochainService: ERROR activating app", lang, " - ", e)
        }

    }

    getDelegateForLanguage(languageHash: String) {
        return new HolochainLanguageDelegate(languageHash, this)
    }

    static dnaID(languageHash: String, dnaNick: String) {
        return `${languageHash}-${dnaNick}`
    }

    async callZomeFunction(lang: string, dna_nick: string, zome_name: string, fn_name: string, payload: object): Promise<any> {
        await this.#ready
        const installed_app_id = lang
        console.debug("HolochainService.callZomefunction: getting info for app:", installed_app_id)
        const infoResult = await this.#appWebsocket.appInfo({installed_app_id})
        console.debug("HolochainService.callZomefunction: get info result:", infoResult)
        const { cell_data } = infoResult
        if(cell_data.length == 0) {
            console.error("HolochainService: tried to call zome function without any installed cell!")
            return null
        }

        const cell = cell_data.find(cell => cell[1] === dna_nick)
        if(!cell) {
            const e = new Error(`No DNA with nick '${dna_nick}' found for language ${installed_app_id}`)
            console.error(e)
            return e
        }

        const cell_id = cell[0]

        try {
            console.debug("HolochainService calling zome function:", dna_nick, zome_name, fn_name, payload)
            const result = await this.#appWebsocket.callZome({
                cap: fakeCapSecret(),
                cell_id,
                zome_name,
                fn_name,
                provenance: await this.pubKeyForLanguage(lang),
                payload: JSON.stringify(payload)
            })
            console.debug("HolochainService zome function result:", result)
            return result
        } catch(e) {
            console.error("HolochainService: ERROR calling zome function:", e)
            return e
        }
    }


}

export function init(configPath, dataPath) {
    const adapter = new FileSync(path.join(dataPath, 'holochain-service.json'))
    return new HolochainService(adapter, configPath, dataPath)
}