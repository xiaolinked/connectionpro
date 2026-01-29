import SwiftUI

@main
struct ConnectionProApp: App {
    @State private var authViewModel = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            AppRootView()
                .environment(authViewModel)
                .onOpenURL { url in
                    Task {
                        await authViewModel.handleDeepLink(url: url)
                    }
                }
        }
    }
}
