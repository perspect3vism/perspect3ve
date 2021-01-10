import LinkRepoController from './LinkRepoController'
import { PerspectivismDb } from './db'
import { v4 as uuidv4 } from 'uuid'
import faker from 'faker'
import type Link from '../acai/Links'
import type { LinkQuery } from '../acai/Links'
import temp from 'temp'
import Memory from 'lowdb/adapters/Memory'

function createLink(): Link {
    return {
        source: faker.internet.url(),
        target: faker.internet.url(),
        predicate: faker.internet.url(),
    } as Link
}

const did = 'did:local-test-agent'
const agentService = { 
    did,
    createSignedExpression: jest.fn(data => {
        return {
            author: { did },
            timestamp: "now",
            data,
            proof: {
                signature: "abcdefgh",
                key: `${did}#primary`
            }
        }
    }),
    agent: { did }
 }
const languageController = {
    getLinksAdapter: () => null
}


describe('LinkRepoController', () => {  
    let linkRepoController
    let perspective
    let allLinks

    beforeEach(() => {
        let db = new PerspectivismDb(new Memory())
        linkRepoController = new LinkRepoController({db, languageController, agent: agentService})
        perspective = { uuid: uuidv4() }
        allLinks = []
    })

    it('wraps links in expressions on addLink', () => {
        const link = createLink()
        const expression = linkRepoController.addLink(perspective, link)
        expect(expression.author).toEqual(agentService.agent)
        expect(expression.data).toEqual(link)
        expect(agentService.createSignedExpression.mock.calls.length).toBe(1)
        expect(agentService.createSignedExpression.mock.calls[0][0]).toEqual(link)
    })

    describe('after adding 5 links', () => {
        beforeEach(() => {
            for(let i=0; i<5; i++) {
                const link = createLink()
                if(i%2 == 0) {
                    link.source = 'root'
                }
                allLinks.push(link)
                linkRepoController.addLink(perspective, link)
            }
        })

        it('has asked agent service for 5 signatures', () => {
            expect(agentService.createSignedExpression.mock.calls.length).toBe(6)
        })

        it('can get all links', async () => {
            const result = await linkRepoController.getLinks(perspective, {} as LinkQuery)

            expect(result.length).toEqual(5)

            for(let i=0; i<5; i++) {
                expect(result).toEqual(
                    expect.arrayContaining(
                        [expect.objectContaining({data: allLinks[i]})]
                    )
                )
            }
        })

        it('can get links by source', async () => {
            const result = await linkRepoController.getLinks(perspective, {source: 'root'} as LinkQuery)
            expect(result.length).toEqual(3)
        })
    })

})








