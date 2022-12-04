const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $message = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML   
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newmessage = $message.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newmessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newmessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $message.offsetHeight

    // Height of messages container
    const containerHeight = $message.scrollHeight

    // How far have I scrolled?
    const scollOffset = $message.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scollOffset) {
        $message.scrollTop = $message.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createAt: moment(message.createAt).format('h:mm A')
    })

    $message.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)

    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createAt: moment(message.createAt).format('h:mm A')
    })

    $message.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) 
            return console.log(error)

        console.log('Message delivery')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation)
        return alert('Geolocation is not supported by your browser')
    
    $sendLocationButton.setAttribute('disabled', 'disabled')    
    
    navigator.geolocation.getCurrentPosition((possition) => {
        socket.emit('sendLocation', {
            latitude: possition.coords.latitude,
            longtitude: possition.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})