import SwiftUI

/// Toast notification view that appears at the top of the screen
struct ToastView: View {
    let toast: ToastItem
    let onDismiss: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: toast.type.iconName)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(toast.type.color)
            
            Text(toast.message)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.primary)
                .lineLimit(2)
            
            Spacer()
            
            Button {
                onDismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background {
            RoundedRectangle(cornerRadius: 12)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        }
        .padding(.horizontal, 16)
    }
}

/// View modifier to add toast functionality to any view
struct ToastModifier: ViewModifier {
    @State private var toastManager = ToastManager.shared
    
    func body(content: Content) -> some View {
        content
            .overlay(alignment: .top) {
                if let toast = toastManager.currentToast {
                    ToastView(toast: toast) {
                        toastManager.dismiss()
                    }
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .padding(.top, 8)
                }
            }
    }
}

extension View {
    /// Adds toast notification overlay to the view
    func toastOverlay() -> some View {
        modifier(ToastModifier())
    }
}

#Preview {
    VStack {
        Spacer()
        Button("Show Success Toast") {
            ToastManager.shared.show("Connection saved successfully!", type: .success)
        }
        .buttonStyle(.borderedProminent)
        Button("Show Error Toast") {
            ToastManager.shared.show("Failed to save connection", type: .error)
        }
        .buttonStyle(.bordered)
        Spacer()
    }
    .toastOverlay()
}
