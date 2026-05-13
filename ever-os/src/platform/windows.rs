use crate::error::{AppError, AppResult};

pub fn process_thread_count() -> AppResult<u64> {
    Ok(std::thread::available_parallelism()
        .map_err(|_| AppError::Internal)?
        .get() as u64)
}

pub fn process_handle_count() -> AppResult<u64> {
    use std::mem::MaybeUninit;

    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn GetCurrentProcess() -> *mut core::ffi::c_void;
        fn GetProcessHandleCount(hProcess: *mut core::ffi::c_void, pdwHandleCount: *mut u32)
        -> i32;
    }

    unsafe {
        let proc = GetCurrentProcess();
        let mut count = MaybeUninit::<u32>::uninit();
        let ok = GetProcessHandleCount(proc, count.as_mut_ptr());
        if ok == 0 {
            return Err(AppError::Internal);
        }
        Ok(count.assume_init() as u64)
    }
}
