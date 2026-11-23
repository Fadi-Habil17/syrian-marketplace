# Feature presentation

Public catalog screens live in catalog, checkout and filters. Account, business workspace, orders, driver assignments, wallet, notifications and administration are composed by the App Router under the member route group. Shared controls render canonical input DTO fields and localize labels. Displayed prices, funded amounts, roles, delivery quotes, and enabled order actions come from REST. Socket events trigger REST refreshes instead of directly mutating the displayed order.
