import SwiftUI

struct AppRootView: View {
    @Environment(AuthViewModel.self) private var authViewModel

    var body: some View {
        Group {
            if authViewModel.isLoading {
                LoadingView(message: "Loading...")
            } else if authViewModel.isAuthenticated {
                MainTabView()
            } else {
                NavigationStack {
                    RegisterView()
                }
            }
        }
    }
}

#Preview {
    AppRootView()
        .environment(AuthViewModel())
}
