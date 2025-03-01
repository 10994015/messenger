<div class="wsus__user_list_item messenger_list_item" data-id="{{ $record->id }}">
    <div class="img">
        <img src="{{ $record->avatar }}" alt="{{ $record->name }}" class="img-fluid">
    </div>
    <div class="text">
        <h5>{{ $record->name }}</h5>
        <p>{{ $record->user_name }}</p>
    </div>
    {{-- <span class="time">10m ago</span> --}}
</div>
