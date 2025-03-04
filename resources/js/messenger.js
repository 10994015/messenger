/**
 * --------------------------------------------------------------------------
 * Global Variables
 * --------------------------------------------------------------------------
*/
var temporaryMessageID = 0;
var activeUserIds = [];

const getMessengerID = () => document.querySelector("meta[name='id']").getAttribute('content');
const setMessengerID = (id) => document.querySelector("meta[name='id']").setAttribute('content', id);

const messageForm = document.querySelector('.message-form'),
    messageInput = document.querySelector('.message-input'),
    csrf_token = document.querySelector('meta[name="csrf_token"]').getAttribute('content'),
    auth_id = document.querySelector('meta[name="auth_id"]').getAttribute('content'),
    url = document.querySelector('meta[name="url"]').getAttribute('content'),
    messageBoxContainer = document.querySelector('.wsus__chat_area_body'),
    selectFile = document.getElementById('select_file'),
    attachmentInput = document.querySelector('.attachment-input'),
    attachmentCancel = document.querySelector('.attachment-cancel'),
    userSearch = document.querySelector('.user_search'),
    userSearchListResult = document.querySelector('.user_search_list_result'),
    messengerContactBox = document.querySelector('.messenger-contacts'),
    favourite = document.querySelector('.favourite');

const deleteMessageElements = document.querySelectorAll('.delete-message');

const enableChatBoxLoader = ()=>{
    document.querySelector('.wsus__message_paceholder').classList.remove('d-none');
    document.querySelector('.wsus__chat_app').classList.remove('show_info');
}
const disableChatBoxLoader = ()=>{
    document.querySelector('.wsus__message_paceholder').classList.add('d-none');
}
const showChatBox = ()=>{
    document.querySelector('.wsus__message_paceholder.block').classList.add('d-none');
}
const hideChatBox = ()=>{
    document.querySelector('.wsus__message_paceholder.block').classList.remove('d-none');
}
const imagePreview = (input, selector)=> {
    if(input.files && input.files[0]){
        let reader = new FileReader();
        reader.onload = (e)=>{
            document.querySelector(selector).src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

let page = 1;
let noMoreDataSearch = false;
let searchTempVal = '';
const searchUsers = async (query)=>{
    if(query != searchTempVal){
        page = 1;
        noMoreDataSearch = false;
        userSearchListResult.innerHTML = '';
    }
    searchTempVal = query;
    if(noMoreDataSearch) return;
    try{
            const api = axios.create({
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            api.interceptors.request.use(
                function (config) {
                    let loader = `
                    <div class="text-center search-loader">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    `;
                    userSearchListResult.insertAdjacentHTML('beforeend', loader);

                    return config;
                },
                function (error) {
                    return Promise.reject(error);
                }
            );
            const response = await api.get('messenger/search', {
                params: {query, page}
            })
            userSearchListResult.querySelector('.search-loader').remove();
            if(response.data.records != null){
                userSearchListResult.insertAdjacentHTML('beforeend', response.data.records);
                noMoreDataSearch = page >= response.data?.last_page;
                if(!noMoreDataSearch){
                    page += 1;
                }
            }


    }catch(error){
            console.log(error);
    }

}
const messageFormReset = ()=>{
    messageForm.reset();
    document.querySelector('.attachment-block').classList.add('d-none');
    document.querySelector('.emojionearea-editor').innerText = '';
}

attachmentCancel.addEventListener('click', messageFormReset);
selectFile.addEventListener('change', (e)=>{
    imagePreview(e.target, '.profile-image-preview');
})
attachmentInput.addEventListener('change', (e)=>{
    imagePreview(e.target, '.attachment-preview');
    document.querySelector('.attachment-block').classList.remove('d-none');
})
const actionOnScroll = (selector, callback, topScroll = false)=>{
    selector.addEventListener('scroll', (e)=>{
        let element = e.currentTarget;
        const condition = topScroll ? element.scrollTop === 0 :
        element.scrollTop + element.clientHeight >= element.scrollHeight;

        if(condition){
            callback();
        }
    })
}
let messagesPage = 1;
let noMoreMessages = false;
let messagesLoading = false;
const fetchMessages = async (id, newFetch = false)=>{
    try{
        if(newFetch){
            messagesPage = 1;
            noMoreMessages = false;
        }
        if(noMoreMessages || messagesLoading) return;
        const api = axios.create({
            headers: {
                'Content-Type': 'application/json',
            }
        });
        api.interceptors.request.use(
            (config)=> {
                messagesLoading = true;
                let loader = `
                    <div class="text-center messages-loader">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                `;
                messageBoxContainer.insertAdjacentHTML('afterbegin', loader);
                return config;
            },
            (error)=> {
                return Promise.reject(error);
            }
        );
        const response = await api.get('/messenger/fetch-messages', {
            params: {
                page: messagesPage,
                _token: csrf_token,
                id: id,
            }
        });
        console.log(response.data);

        messageBoxContainer.querySelector('.messages-loader').remove();
        if(response.data.messages != null){
            makeSeen(true);
            if(messagesPage === 1){
                messageBoxContainer.innerHTML = response.data.messages
                scrollToBottom(messageBoxContainer);
            }else{
                const previousScrollHeight = messageBoxContainer.scrollHeight;
                messageBoxContainer.insertAdjacentHTML('afterbegin', response.data.messages);
                messageBoxContainer.scrollTop = messageBoxContainer.scrollHeight - previousScrollHeight;
            }}
            noMoreMessages = messagesPage >= response.data?.last_page;
            if(!noMoreMessages){
                messagesPage += 1;
            }
        disableChatBoxLoader();
        messagesLoading = false;
    } catch(error){
        console.log(error);
        messageBoxContainer.querySelector('.messages-loader').remove();
    }
}

let contactsPage = 1;
let noMoreContacts = false;
let contactsLoading = false;
const getContacts = async ()=>{
    if( noMoreContacts || contactsLoading) return;
    try{
        const api = axios.create({
            headers: {
                'Content-Type': 'application/json',
            }
        });
        api.interceptors.request.use(
            (config)=> {
                contactsLoading = true
                let loader = `
                    <div class="text-center contacts-loader">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                `;
                messengerContactBox.insertAdjacentHTML('beforeend', loader);
                return config;
            },
            (error)=> {
                return Promise.reject(error);
            }
        );
        const response = await api.get('/messenger/fetch-contacts', {
            params: {
                _token: csrf_token,
                page: contactsPage,
            }
        });
        console.log(response.data);
        if(response.data.contacts != null){
            if(contactsPage === 1){
                messengerContactBox.innerHTML = response.data.contacts
            }else{
                messengerContactBox.insertAdjacentHTML('beforeend', response.data.contacts);

            }
            noMoreContacts = contactsPage >= response.data?.last_page;
            if(!noMoreContacts){
                contactsPage += 1;
            }
        }
        contactsLoading = false;
        if(messengerContactBox.querySelector('.contacts-loader')){
            messengerContactBox.querySelector('.contacts-loader').remove();
        }
        updateUserActiveList();
    }catch(error){
        contactsLoading = false;
        if(messengerContactBox.querySelector('.contacts-loader')){
            messengerContactBox.querySelector('.contacts-loader').remove();
        }
        console.log(error);
    }
}
getContacts();


const deleteMessage = async (e, message_id)=>{
    e.preventDefault();

    console.log(message_id);
    try{
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
          })
        if (result.isConfirmed) {
            const api = axios.create({
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            api.interceptors.request.use(
                (config)=> {
                    document.querySelector(`.message-card[data-id="${message_id}"]`).remove();
                    return config;
                },
                (error)=> {
                    return Promise.reject(error);
                }
            );
            try{
                const response = await api.delete('/messenger/delete-message', {
                    data: {
                        _token: csrf_token,
                        message_id: message_id
                    }
                });

                updateContactItem(getMessengerID());

                Swal.fire({
                    title: "Deleted!",
                    text: "Your file has been deleted.",
                    icon: "success"
                });
            }catch(error){
                console.log(error);
                Swal.fire({
                    title: "failed!",
                    text: "Something went wrong.",
                    icon: "error"
                });
            }
        }
    }catch(error){
        console.log(error);
    }
}

const updateContactItem = async (user_id)=>{
    if(user_id == auth_id) return;
    try{
        const api = axios.create({
            headers: {
                'Content-Type': 'application/json',
            }
        });
        api.interceptors.request.use(
            (config)=> {
                return config;
            },
            (error)=> {
                return Promise.reject(error);
            }
        );
        const response =  await api.get('/messenger/update-contact-item', {
            params: {
                user_id
            }
        });
        messengerContactBox.querySelector(`.messenger_list_item[data-id="${user_id}"]`).remove();
        messengerContactBox.insertAdjacentHTML('afterbegin', response.data.contact_item);

        if(activeUserIds.includes(+user_id)){
            userActive(user_id);
        }

        if(user_id === getMessengerID()){
            updateSelectedContent(user_id);
        }
    }catch(error){
        console.log(error);
    }
}
const updateSelectedContent = (user_id)=>{
    for(const item of document.querySelectorAll('.messenger_list_item')){
        item.classList.remove('active');
    }
    document.querySelector(`.messenger_list_item[data-id="${user_id}"]`).classList.add('active');
}

const makeSeen = async (stauts)=>{
    try{
        const unseenCount = document.querySelector(`.messenger_list_item[data-id="${getMessengerID()}"] .unseen_count`);
        console.log(unseenCount);

        if(unseenCount){
            unseenCount.remove();
        }
        const api = axios.create({
            headers: {
                'Content-Type': 'application/json',
            }
        });
        api.interceptors.request.use(
            (config)=> {
                return config;
            },
            (error)=> {
                return Promise.reject(error);
            }
        );
        const response =  await api.post('/messenger/make-seen', {
            _token: csrf_token,
            id: getMessengerID(),
        });

    }catch(error){
        console.log(error);
    }
}

const star = async (user_id)=>{
    try{
        favourite.classList.toggle('active');
        const api = axios.create({
            headers: {
                'Content-Type': 'application/json',
            }
        });
        api.interceptors.request.use(
            (config)=> {
                return config;
            },
            (error)=> {
                return Promise.reject(error);
            }
        );
        const response =  await api.post('/messenger/favourite', {
            _token: csrf_token,
            id: user_id,
        });
        if(response.data.status === 'added'){
            notyfBottom.success('Added to favourite');
        }else{
            notyfBottom.success('Removed from favourite');
        }

    }catch(error){
        console.log(error);
    }
}

const scrollToBottom = (container)=>{
    container.scrollTop = container.scrollHeight;
}

const debounce = (func, delay)=>{
    let inDebounce;
    return function(...args){
        const context = this;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(()=>{
            func.apply(context, args);
        }, delay)
    }
}

const debouncedSearch = debounce(function(){
    const value = userSearch.value;
    searchUsers(value);
}, 500);

userSearch.addEventListener('keyup', (e)=>{
    let query = e.target.value;
    if(query.length > 0){
        debouncedSearch();
    }
})
actionOnScroll(userSearchListResult, ()=>{
    let value = userSearch.value || '';
    searchUsers(value);
})

actionOnScroll(messageBoxContainer, ()=>{
    fetchMessages(getMessengerID());
}, true)

actionOnScroll(messengerContactBox, ()=>{
    getContacts();
})
const IDinfo = async (id)=>{
    try{
        const api = axios.create();
        api.interceptors.request.use(
            function (config) {
                NProgress.start();
                enableChatBoxLoader();
                return config;
            },
            function (error) {
                return Promise.reject(error);
            }
        );
        const response = await api.get('/messenger/id-info', {
            params: {id}
        });
        const fetch = response.data.fetch;
        fetchMessages(fetch.id, true);
        document.querySelector('.wsus__chat_info_gallery').innerHTML = ""
        if(response.data?.shard_photos){
            document.querySelector('.nothing_share').classList.add('d-none');
            document.querySelector('.wsus__chat_info_gallery').innerHTML = response.data.shard_photos;
        }else{
            document.querySelector('.nothing_share').classList.remove('d-none');
        }
        response.data.favourite ? favourite.classList.add('active') : favourite.classList.remove('active');
        const messengerHeader = document.querySelector('.messenger_header');
        const messengerInfoView = document.querySelector('.messenger_info_view');
        messengerHeader.querySelector('img').src = fetch.avatar;
        messengerHeader.querySelector('h4').innerText = fetch.name;
        messengerInfoView.querySelector('.user_photo img').src = fetch.avatar;
        messengerInfoView.querySelector('.user_name').innerText = fetch.name;
        messengerInfoView.querySelector('.user_unique_name').innerText = fetch.user_name;
        NProgress.done();
        showChatBox();
        console.log(response.data);
    }catch(error){
        console.log(error);
        disableChatBoxLoader();
    }


}

document.body.addEventListener('click', function(e) {
    // 找到最近的匹配選擇器的祖先元素（或元素本身）
    const messengerItem = e.target.closest('.messenger_list_item');
    const backToList = e.target.closest('.back_to_list');
    const deleteMessageElement = e.target.closest('.delete-message');
    // 如果找到了匹配的元素
    if (messengerItem) {
        if(window.innerWidth < 768){
            document.querySelector('.wsus__user_list').classList.add('d-none');
        }
        const dataId = messengerItem.getAttribute('data-id');
        console.log(dataId);
        setMessengerID(dataId);
        updateSelectedContent(dataId);
        IDinfo(dataId);
    }
    if(backToList){
        document.querySelector('.wsus__user_list').classList.remove('d-none');
        // hideChatBox();
    }
    if(deleteMessageElement){
        const message_id = deleteMessageElement.getAttribute('data-id');
        deleteMessage(e, message_id);
    }
});


const sendTempMessageCard = (message, tempId, attachment=false)=>{
    if(attachment){
        return `
        <div class="wsus__single_chat_area" data-id="${tempId}">
            <div class="wsus__single_chat chat_right">
                <div class="pre_loader">
                    <div class="spinner-border text-light" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                ${message.length > 0 ? `<p class="messages">${message}</p>` : ''}
                <span class="clock "><i class="far fa-clock"></i> now</span>
            </div>
        </div>`;
    }
    return `
    <div class="wsus__single_chat_area" data-id="${tempId}">
        <div class="wsus__single_chat chat_right">
            <p class="messages">${message}</p>
            <span class="clock "><i class="far fa-clock"></i> now</span>
        </div>
    </div>
    `;
}
const playNotification = ()=>{
    const sound = new Audio(`/default/8_message-sound.mp3`);
    sound.play();
}
const reciveMessageCard = (e)=>{
    if(e.attachment){
        return `
        <div class="wsus__single_chat_area" data-id="${e.id}">
            <div class="wsus__single_chat">
                <a class="venobox" data-gall="gallery${e.id}" href="${url + e.attachment}">
                    <img src="${url + e.attachment}" alt="gallery${e.id}" class="img-fluid w-100">
                </a>
                ${e.body.length > 0 ? `<p class="messages">${e.body}</p>` : ''}
                <span class="clock "><i class="far fa-clock"></i> now</span>
            </div>
        </div>`;
    }
    return `
    <div class="wsus__single_chat_area" data-id="${e.id}">
        <div class="wsus__single_chat">
            <p class="messages">${e.body}</p>
        </div>
    </div>
    `;
}

const sendMessage = async ()=>{
    temporaryMessageID += 1;
    const tempID = `temp_${temporaryMessageID}`;
    const hasAttachment = !!attachmentInput.value;
    const inputValue = messageInput.value;
    if(inputValue.length === 0 && !hasAttachment) return;
    const formData = new FormData(document.querySelector('.message-form'));
    formData.append('_token', csrf_token);
    formData.append('id', getMessengerID());
    formData.append('temporaryMessageId', tempID);
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    try{
        const api = axios.create({
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        api.interceptors.request.use(
            function (config) {
                console.log(hasAttachment);

                messageBoxContainer.insertAdjacentHTML('beforeend', sendTempMessageCard(inputValue, tempID, hasAttachment));
                scrollToBottom(messageBoxContainer);
                messageFormReset();

                return config;
            },
            function (error) {
                return Promise.reject(error);
            }
        );
        const response = await api.post('/messenger/send-message', formData);
        updateContactItem(getMessengerID());
        const tempMessageCardElement = messageBoxContainer.querySelector(`.wsus__single_chat_area[data-id="${tempID}"]`);
        if (tempMessageCardElement) {
            tempMessageCardElement.insertAdjacentHTML('beforebegin', response.data.message);
            tempMessageCardElement.remove();
        }

        console.log(tempMessageCardElement);
        messageInput.focus();

    } catch(error){
        console.log(error);
    }

}
messageForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    sendMessage();
})

favourite.addEventListener('click', (e)=>{
    e.preventDefault();
    star(getMessengerID());
});

const setActiveUserIds = (users)=>{
    //users is [{id:1}, {id:2}...]
    activeUserIds = users.map(user=>user.id);
}

const addActiveNewId = (id)=>{
    activeUserIds.push(id);
}

const removeActiveIs = (id)=>{
    activeUserIds = activeUserIds.filter(user=>user !== id);
}

const updateUserActiveList = ()=>{
    const contactItems = document.querySelectorAll(`.messenger_list_item`);
    for(let i=0;i<contactItems.length;i++){
        //get data-id value
        const userId = contactItems[i].getAttribute('data-id');
        if (activeUserIds.includes(+userId)) {
            userActive(userId);
        } else {
            userInactive(userId);
        }
    }
}
window.Echo.private(`message.${auth_id}`)
.listen("Message", (e)=>{
    console.log(e);
    let message = reciveMessageCard(e);

    if(getMessengerID() != e.from_id){
        updateContactItem(e.from_id);
        playNotification();
    }
    if(getMessengerID() == e.from_id){
        messageBoxContainer.insertAdjacentHTML('beforeend', message);
        scrollToBottom(messageBoxContainer);
    }
})

const userActive = (id)=>{
    const contactItems = document.querySelectorAll(`.messenger_list_item[data-id="${id}"]`);
    console.log(contactItems);
    for(let i=0;i<contactItems.length;i++){
        if (contactItems[i]) {
            const imgElement = contactItems[i].querySelector('.img');
            if (imgElement) {
                const spanElement = imgElement.querySelector('span');
                if (spanElement) {
                    spanElement.classList.remove('inactive');
                    spanElement.classList.add('active');
                }
            }
        }
    }
}
const userInactive = (id)=>{
    const contactItems = document.querySelectorAll(`.messenger_list_item[data-id="${id}"]`);
    console.log(contactItems);
    for(let i=0;i<contactItems.length;i++){
        if (contactItems[i]) {
            const imgElement = contactItems[i].querySelector('.img');
            if (imgElement) {
                const spanElement = imgElement.querySelector('span');
                if (spanElement) {
                    spanElement.classList.remove('active');
                    spanElement.classList.add('inactive');
                }
            }
        }
    }
}
window.Echo.join('online')
.here(users=>{
    setActiveUserIds(users);
    console.log(activeUserIds);
    users.forEach(user=>{
        userActive(user.id)
    })
})
.joining(user=>{
    addActiveNewId(user.id);
    console.log(activeUserIds);
    userActive(user.id);
})
.leaving(user=>{
    removeActiveIs(user.id);
    console.log(activeUserIds);

    userInactive(user.id);
})

