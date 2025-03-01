
<div class="wsus__user_list_item messenger_list_item" data-id="{{ $user->id }}">
    <div class="img">
        <img src="{{ asset($user->avatar) }}" alt="{{ $user->name }}" class="img-fluid">
        <span class="active"></span>
    </div>
    <div class="text">
        <h5>{{ $user->name }}</h5>
        @if($lastMessage->from_id === auth()->id())
        <p><span>You</span> {{ $lastMessage->body }}</p>
        @else
        <p>{{ $lastMessage->body }}</p>
        @endif
    </div>
    @if($unseenCounter > 0)
        <span class="badge bg-danger text-light time unseen_count">{{ $unseenCounter }}</span>
    @endif
</div>
