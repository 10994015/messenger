<?php

namespace App\Http\Controllers;

use App\Events\Message as EventsMessage;
use App\Models\Favorite;
use App\Models\Message;
use App\Models\User;
use App\Traits\FileUploadTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class MessengerController extends Controller
{
    use FileUploadTrait;
    public function index(): View
    {
        $favoriteList = Favorite::with('user:id,name,avatar')->where('user_id', Auth::id())->get();
        return view('messenger.index', compact('favoriteList'));
    }
    public function search(Request $request){
        $getRecords = null;
        $query = $request->input('query');
        $records = [];
        if($query){
            $records =  User::where('id', '!=', Auth::id())
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%'.$query.'%')
                ->orWhere('user_name', 'like', '%'.$query.'%');
            })
            ->paginate(10);
        }
        if($records->isEmpty()){
            $getRecords = "<p class='text-center'>Nothing to show.</p>";

        }
        foreach($records as $record){
            $getRecords .= view('messenger.components.search-item', compact('record'))->render();
        }

        return response()->json([
            'records' => $getRecords,
            'last_page' => $records->lastPage(),
        ]);
    }

    public function fetchIdInfo(Request $request){
        $id = $request->input('id');
        $fetch = User::find($id);
        $favourite = Favorite::where('favorited_id', $id)->where('user_id', Auth::id())->exists();
        $shardPhotos = Message::where(function ($query) use ($id) {
            $query->where('from_id', Auth::id())
            ->where('to_id', $id)
            ->whereNotNull('attachment');
        })->orWhere(function ($query) use ($id) {
            $query->where('from_id', $id)
            ->where('to_id', Auth::id())
            ->whereNotNull('attachment');
        })
        ->latest()->get();

        $content = '';
        foreach($shardPhotos as $photo){
            $content .= view('messenger.components.gallery-item', compact('photo'))->render();
        }

        return response()->json([
            'fetch'=> $fetch,
            'favourite' => $favourite,
            'shard_photos' => $content,
        ]);
    }
    public function sendMessage(Request $request){
        $validate = $request->validate([
            // 'message' => 'required',
            'id' => 'required|integer',
            'temporaryMessageId' => 'required',
            'attachment' => 'nullable|image|max:1024',
        ]);

        $attachmentPath = $this->uploadFile($request, 'attachment');
        $message = new Message();
        $message->from_id = Auth::id();
        $message->to_id = $request->input('id');
        $message->body = $request->input('message');
        if($attachmentPath){
            $message->attachment = json_encode($attachmentPath);
        }
        $message->save();

        EventsMessage::dispatch($message);

        return response()->json([
            'message' => $this->messageCard($message, !!$attachmentPath),
            'tempID' => $request->input('temporaryMessageId'),
        ]);
    }
    public function messageCard($message, $attachment = false){
        return view('messenger.components.message-card', compact('message', 'attachment'))->render();
    }
    public function fetchMessages(Request $request){
        $id = $request->input('id');
        $messages = Message::where(function ($query) use ($id) {
            $query->where('from_id', Auth::id())
            ->where('to_id', $id);
        })->orWhere(function ($query) use ($id) {
            $query->where('from_id', $id)
            ->where('to_id', Auth::id());
        })->latest()->paginate(20);

        $response = [
            'last_page' => $messages->lastPage(),
            'last_message'=> $messages->last(),
            'messages' => '',
        ];

        if($messages->isEmpty()){
            $response['messages'] = "<div class='d-flex justify-content-center align-items-center h-100'><p class='text-center'>Say 'Hello' to start conversation.</p></div>";
            return response()->json($response);
        }

        $allMessages = '';
        foreach($messages->reverse() as $message){
            $allMessages .= $this->messageCard($message, !!$message->attachment);
        }
        $response['messages'] = $allMessages;
        return response()->json($response);

    }

    public function fetchContacts(Request $request){
        $users = Message::join('users', function($join){
            $join->on('users.id', '=', 'messages.from_id')
            ->orOn('users.id', '=', 'messages.to_id');
        })
        ->where(function ($query){
            $query->where('from_id', Auth::id())
            ->orWhere('to_id', Auth::id());
        })
        ->where('users.id', '!=', Auth::id())
        ->select('users.*', DB::raw('MAX(messages.created_at) as max_message'))
        ->orderBy('max_message', 'desc')
        ->groupBy('users.id')
        ->paginate(10);
        $contacts = '';
        if(!$users->isEmpty()){
            foreach($users as $user){
                $contacts .= $this->getContactItem($user);
            }
        }else{
            $contacts = "<p class='text-center'>Your contact list is empty.</p>";
        }

        return response()->json([
            'contacts' => $contacts,
            'last_page' => $users->lastPage(),
        ]);
    }
    public function getContactItem($user){
        $lastMessage = Message::where(function ($query) use ($user){
            $query->where('from_id', Auth::id())
            ->where('to_id', $user->id);
        })->orWhere(function ($query) use ($user){
            $query->where('from_id', $user->id)
            ->where('to_id', Auth::id());
        })->latest()->first();

        $unseenCounter = Message::where('from_id', $user->id)->where('to_id', Auth::id())->where('seen', 0)->count();

        return view('messenger.components.contact-list-item', compact('user', 'lastMessage', 'unseenCounter'))->render();
    }
    public function updateContactItem(Request $request){
        $user = User::find($request->input('user_id'));
        if($user){
            return response()->json([
                'contact_item' => $this->getContactItem($user),
            ], 200);
        }
        return response()->json([
            'message' => 'User not found.',
        ], 404);
    }

    public function makeSeen(Request $request){
        Message::where('from_id', $request->input('id'))->where('to_id', Auth::id())->where('seen', 0)->update(['seen' => 1]);
        return true;
    }

    public function favourite(Request $request){
        $query = Favorite::where('favorited_id', $request->input('id'))->where('user_id', Auth::id());
        $favoriteStatus = $query->exists();
        if(!$favoriteStatus){
            $favorite = new Favorite();
            $favorite->favorited_id = $request->input('id');
            $favorite->user_id = Auth::id();
            $favorite->save();

            return response()->json([
                'status' => 'added',
            ], 200);
        }else{
            $query->delete();
            return response()->json([
                'status' => 'removed',
            ], 204);
        }
    }

    public function deleteMessage(Request $request){
        $id = $request->input('message_id');
        $message = Message::findOrfail($id);
        if($message->from_id == Auth::id()){
            $message->delete();
            return response()->json([
                'message' => 'Message deleted successfully.',
                'id'=> $id,
            ], 200);
        }
    }


}
