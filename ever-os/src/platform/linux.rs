use crate::error::{AppError, AppResult};

pub fn process_thread_count() -> AppResult<u64> {
    let s = std::fs::read_to_string("/proc/self/status").map_err(|_| AppError::Internal)?;
    for line in s.lines() {
        if let Some(rest) = line.strip_prefix("Threads:") {
            let n = rest.trim().parse::<u64>().map_err(|_| AppError::Internal)?;
            return Ok(n);
        }
    }
    Err(AppError::Internal)
}

pub fn process_handle_count() -> AppResult<u64> {
    let entries = std::fs::read_dir("/proc/self/fd").map_err(|_| AppError::Internal)?;
    Ok(entries.count() as u64)
}
