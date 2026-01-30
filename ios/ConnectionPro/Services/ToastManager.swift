import SwiftUI

/// Type of toast notification
enum ToastType {
    case success
    case error
    case info
    case warning
    
    var iconName: String {
        switch self {
        case .success: return "checkmark.circle.fill"
        case .error: return "xmark.circle.fill"
        case .info: return "info.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .success: return .green
        case .error: return .red
        case .info: return .blue
        case .warning: return .orange
        }
    }
}

/// Represents a single toast notification
struct ToastItem: Identifiable, Equatable {
    let id = UUID()
    let message: String
    let type: ToastType
    let duration: TimeInterval
    
    static func == (lhs: ToastItem, rhs: ToastItem) -> Bool {
        lhs.id == rhs.id
    }
}

/// Observable singleton for managing app-wide toast state
@Observable
@MainActor
final class ToastManager {
    static let shared = ToastManager()
    
    private(set) var currentToast: ToastItem?
    private var dismissTask: Task<Void, Never>?
    
    private init() {}
    
    /// Show a toast notification
    /// - Parameters:
    ///   - message: The message to display
    ///   - type: The type of toast (success, error, info, warning)
    ///   - duration: How long to show the toast (default 3 seconds)
    ///   - withHaptic: Whether to trigger haptic feedback (default true)
    func show(_ message: String, type: ToastType = .info, duration: TimeInterval = 3.0, withHaptic: Bool = true) {
        // Cancel any pending dismiss
        dismissTask?.cancel()
        
        // Trigger haptic feedback
        if withHaptic {
            switch type {
            case .success: HapticService.success()
            case .error: HapticService.error()
            case .warning: HapticService.warning()
            case .info: HapticService.lightImpact()
            }
        }
        
        // Show the toast
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            currentToast = ToastItem(message: message, type: type, duration: duration)
        }
        
        // Schedule dismiss
        if duration > 0 {
            dismissTask = Task {
                try? await Task.sleep(for: .seconds(duration))
                if !Task.isCancelled {
                    await dismiss()
                }
            }
        }
    }
    
    /// Dismiss the current toast
    func dismiss() {
        dismissTask?.cancel()
        withAnimation(.easeOut(duration: 0.2)) {
            currentToast = nil
        }
    }
}
