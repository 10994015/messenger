<div class="modal fade" id="exampleModal" style="z-index: 999999" tabindex="-1" aria-labelledby="exampleModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" style="z-index: 999999"  >
        <div class="modal-content">
            <div class="modal-body">
                <form action="#" class="profile-form">
                    @csrf
                    <div class="file profile-file">
                        <img src="{{ asset(auth()->user()->avatar) }}" alt="Upload" class="img-fluid profile-image-preview">
                        <label for="select_file"><i class="fal fa-camera-alt"></i></label>
                        <input id="select_file" type="file" hidden name="avatar">
                    </div>
                    <p>Edit information</p>
                    <input type="text" placeholder="Name" value="{{ auth()->user()->name }}" name="name">
                    <input type="text" placeholder="User name" value="{{ auth()->user()->user_name }}" name="user_name">
                    <input type="email" placeholder="Email" value="{{ auth()->user()->email }}" name="email">
                    <p>Change password</p>
                    <div class="row">
                        <div class="col-xl-6">
                            <input type="password" placeholder="Current password" name="current_password">
                        </div>
                        <div class="col-xl-6">
                            <input type="password" placeholder="New password" name="password">
                        </div>
                        <div class="col-xl-12">
                            <input type="password" placeholder="Confirm password" name="password_confirmation">
                        </div>
                    </div>
                    <div class="modal-footer p-0 mt-3">
                        <button type="button" class="btn btn-secondary cancel"
                            data-bs-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-primary save profile-save">Save changes</button>
                    </div>
                </form>
            </div>

        </div>
    </div>
</div>

@push('scripts')
<script>
    const profileForm = document.querySelector('.profile-form');
    const profileSave = document.querySelector('.profile-save');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(profileForm);
        // notyfTop.success('Your changes have been successfully saved!');
        const api = axios.create({
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        api.interceptors.request.use(
            function (config) {
                profileSave.innerHTML = 'saving...';
                profileSave.disabled = true;
                return config;
            },
            function (error) {
                return Promise.reject(error);
            }
        );

        try{
            const response = await api.post('{{ route("profile.update") }}', formData);
            console.log(response.data);
            window.location.reload();
        } catch (error) {
            const errors = error.response.data.errors;
            console.log(errors);
            for(const key in errors) {
                notyfTop.error(errors[key][0]);
            }
            profileSave.innerHTML = 'Save changes';
            profileSave.disabled = false;
        }
    })
</script>

@endpush
