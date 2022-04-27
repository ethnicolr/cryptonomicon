const API_KEY =
    'f8c5d1ad7a09b2836cb4e910ec1a4280f50d0409de79f89a7bd7f01f0bd6b9d0'
const AGGREGATE_INDEX = '5'

const socket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
)
const tickersHandlers = new Map()

// TODO подписка на разных вкладках shared worker

// TODO: urlUseSearchparams
// todo Nanoevents

socket.addEventListener('message', (e) => {
    const {
        TYPE: type,
        FROMSYMBOL: currency,
        PRICE: newPrice,
    } = JSON.parse(e.data)
    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return
    }

    const handlers = tickersHandlers.get(currency) ?? []
    handlers.forEach((fn) => fn(newPrice))
})

function sendToWebSocket(message) {
    const stringifiedMessage = JSON.stringify(message)

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage)
        return
    }

    socket.addEventListener(
        'open',
        () => {
            socket.send(stringifiedMessage)
        },
        { once: true }
    )
}

function subscribeToTickerOnWs(ticker) {
    sendToWebSocket({
        action: 'SubAdd',
        subs: [`5~CCCAGG~${ticker}~USD`],
    })
}

function unsubscribeFromTickerOnWs(ticker) {
    sendToWebSocket({
        action: 'SubRemove',
        subs: [`5~CCCAGG~${ticker}~USD`],
    })
}

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || []
    tickersHandlers.set(ticker, [...subscribers, cb])
    subscribeToTickerOnWs(ticker)
}

export const unsubscribeFromTicker = (ticker) => {
    tickersHandlers.delete(ticker)
    unsubscribeFromTickerOnWs(ticker)
}
