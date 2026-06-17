# Security Specification: Dadu 24#7 Firestore Security

This security specification outlines data invariants, security policies, threat vectors ("Dirty Dozen" payloads), and audit test plans for the Firebase integration in Dadu 24#7 application.

## 1. Data Invariants & Access Control Matrices

### Entities & Location Specs
1. **Food Menu (`/food_items/{itemId}`)**
   - **Properties**: `name` (string), `price` (number), `description` (string), `category` (string), `imageUrl` (string), `isAvailable` (boolean).
   - **Access**:
     - **Read**: Anyone (Public guests) can view the food items menu, filter by category, or query items to check availability.
     - **Write**: Only the authorized, verified administrator (`blackpel120@gmail.com`) is allowed to create, update, or delete menu records.

2. **Electrician Services (`/electrician_services/{serviceId}`)**
   - **Properties**: `name` (string), `basePrice` (number), `description` (string), `category` (string), `imageUrl` (string), `isAvailable` (boolean).
   - **Access**:
     - **Read**: Anyone (Public guests) can read diagnostic packages.
     - **Write**: Only the authorized, verified administrator (`blackpel120@gmail.com`) can create, update, or delete electrician service cards.

3. **Orders (`/orders/{orderId}`)**
   - **Properties**: `customerName` (string), `phoneNumber` (string), `deliveryAddress` (string), `nearestLandmark` (string, optional), `items` (array of items with `id`, `name`, `price`, `quantity`, `type`), `totalAmount` (number), `status` (enum: `'Pending' | 'Accepted' | 'Preparing' | 'Out for Delivery' | 'Completed' | 'Cancelled'`), `createdAt` (datetime-timestamp), `orderNotes` (string, optional), `paymentMethod` (`'Cash on Delivery'`).
   - **Access**:
     - **Create**: Anyone (unauthenticated guests) can place a new order on cash on delivery.
     - **Read (Single document `get`)**: Allowed if the document exists, and either the request is from a verified administrator or the transaction was recorded locally (checked via unique ID matching or the client-side local registry).
     - **Read (Collection `list` query)**: Restriced strictly to the verified workspace administrator (`blackpel120@gmail.com`). Guests are blocked from performing blanket list searches to protect client PII (names, phone numbers, landmarks, delivery routes).
     - **Update**:
       - Admins can transition orders to any status branch.
       - Terminal State Lock: Once an order status is marked `'Completed'` or `'Cancelled'`, no modifications to billing details, names, or items can take place by any standard user.

---

## 2. The "Dirty Dozen" Threat Payloads

The following malicious payloads must be rejected by the security rules:

1. **Unauthenticated Menu Creation**
   - *Attempt*: Create a food item document as guest.
   - *Result*: `PERMISSION_DENIED`.

2. **Price Poisoning Modification**
   - *Attempt*: Guest updates an existing food item's price to `0` or negative integers.
   - *Result*: `PERMISSION_DENIED`.

3. **Remote Menu Wipeout**
   - *Attempt*: Guest issues delete call to `/food_items/{id}`.
   - *Result*: `PERMISSION_DENIED`.

4. **Malicious Electrician Service Injection**
   - *Attempt*: Guest adds an unverified electrical diagnostic package.
   - *Result*: `PERMISSION_DENIED`.

5. **Blanket Database Reading (PII Scraping)**
   - *Attempt*: Unauthenticated guest queries `/orders` collection without filters to access customer address/phone details.
   - *Result*: `PERMISSION_DENIED`.

6. **Order State Shortcutting**
   - *Attempt*: Customer creates a new order immediately marked with status `'Completed'` or `'Preparing'` instead of the initial `'Pending'` state.
   - *Result*: `PERMISSION_DENIED`.

7. **Negative Billing Insertion**
   - *Attempt*: Placing a guest order with a negative total amount to receive free items.
   - *Result*: `PERMISSION_DENIED`.

8. **Empty Order Schema Injection**
   - *Attempt*: Place a document into `/orders` but with missing customer name or blank delivery address properties.
   - *Result*: `PERMISSION_DENIED`.

9. **Unauthorized Remote Status Sabotage**
   - *Attempt*: Guest changes other active orders directly to status `'Cancelled'` or `'Completed'`.
   - *Result*: `PERMISSION_DENIED`.

10. **Malicious ID Length Poisoning**
    - *Attempt*: Creating or looking up a document with a 2MB binary string as an ID to exhaust resources.
    - *Result*: `PERMISSION_DENIED`.

11. **Post-Terminal Modifications (Immortal Order Details)**
    - *Attempt*: Changing customer names or order items on an already completed order.
    - *Result*: `PERMISSION_DENIED`.

12. **System Privilege Escalation Attack**
    - *Attempt*: Modifying an order to inject security overrides or custom system attributes.
    - *Result*: `PERMISSION_DENIED`.

---

## 3. Test Runner Design

We will write `firestore.rules` and run validation to ensure full compliance of terminal locks, PII protection, admin boundaries, and value limits.
