# Admin Onboarding Guide: Wheely Good Pizza App

Welcome! As an **Admin** in the Wheely Good Pizza app, you are like the boss of the system. You have full access to everything, which means you can manage the team, check money reports, add new menu items, and more. This guide will help you get started and understand how to use the app step by step. It's designed for people who aren't tech experts—just follow along!

Think of the app like a digital notebook for running your pizza truck business. You'll use it on a computer or tablet. If something doesn't work, ask a tech person for help.

## 1. What Does an Admin Do?
- You can see and change everything in the app.
- Your main jobs: Add or remove team members, check sales and inventory (like stock of ingredients), buy supplies, create recipes, track money, and look at reports to make smart business decisions.
- Other roles (like Cashier or Kitchen staff) have limited access—they can't do things like manage users or see full money reports. That's why your role is important for keeping things secure.

## 2. Getting Started: How to Log In
1. Open your web browser (like Chrome or Edge) and go to the app's website (for example, http://localhost:5082 if testing, or the real site your team sets up).
2. If you're not logged in, the app will take you to the **Login** page automatically.
3. Enter your **email** (like admin@pizzatruck.com) and **password** (the default is "password"—change it right away for safety!).
4. Click "Log In."
5. You'll land on the **Dashboard** page. This is your home base.

**Tip:** If you forget your password, ask another admin or tech support to reset it. Always log in from a safe device.

## 3. Understanding the App Layout
- **Top Bar (Header)**: Shows your name, a logout button, and maybe notifications (like low stock alerts).
- **Side Menu (Sidebar)**: A list on the left with links to all pages. Click these to move around.
- **Main Area**: Where the page content shows up.
- **Buttons and Forms**: Simple buttons like "Create" or "Save" to add info. Forms are like fill-in-the-blanks boxes.

The app flows like this: Start at Dashboard > Check or do tasks on other pages > Log out when done.

## 4. Main Pages and What You Can Do
Here's a simple flow for a typical day as an admin. Start at the Dashboard, then click sidebar links to go to other pages.

### Dashboard (/dashboard)
- **What it is**: Your quick overview page, like a summary report.
- **What you can do**:
  - See charts for sales, profits, and low-stock ingredients (e.g., "We're low on cheese!").
  - Check key numbers like today's revenue (money made) or inventory levels.
- **Flow Tip**: Visit this first every day to see what's going on. If something looks wrong (like low stock), click to Inventory or Reports for more details.

### User Management (/users)
- **What it is**: Where you add, edit, or remove team members (like cashiers or kitchen staff).
- **What you can do**:
  1. Fill out a form: Enter their email, password, name, and role (Admin, Cashier, or Kitchen).
  2. Click "Create User" to add them.
  3. See a list of all users—click edit (pencil icon) or delete (trash icon) if needed.
- **Flow Tip**: Use this when hiring new staff. Only admins can access this—it's secure!

### Inventory (/inventory)
- **What it is**: Tracks your ingredients (like flour or sauce) and how much you have.
- **What you can do**:
  - View a list of ingredients with current amounts.
  - Add or adjust stock (e.g., if something is wasted, note it here).
  - See warnings for low stock.
- **Flow Tip**: Check this after a busy day or before buying more supplies. It connects to Purchases for buying new stuff.

### Purchases (/purchases)
- **What it is**: Records when you buy ingredients from suppliers.
- **What you can do**:
  1. Choose a supplier from the list.
  2. Add items: Pick ingredients, enter quantity and cost.
  3. Save the purchase—it automatically updates your inventory.
- **Flow Tip**: Use this when you get a delivery. It helps track costs for reports.

### Products (/products)
- **What it is**: Manages your menu items (like "Margherita Pizza").
- **What you can do**:
  1. Add a new product: Enter name, code (SKU), price, and recipe (e.g., "200g flour + 100g cheese").
  2. Edit existing ones or mark them as inactive.
- **Flow Tip**: Update this when adding a new pizza flavor. Recipes link to Inventory so stock gets used up correctly.

### Sales (/sales)
- **What it is**: Where sales happen (like ringing up a customer).
- **What you can do**:
  - Add products to a sale, choose payment (cash/card), and complete it.
  - View past sales.
- **Flow Tip**: Cashiers usually handle this, but as admin, you can step in or check details. Needs an active "session" (see Sessions below).

### Sessions (/sessions)
- **What it is**: Like opening and closing the cash register for a shift.
- **What you can do**:
  1. Open a session: Enter starting cash amount and note current inventory.
  2. Close it at shift end: Enter ending cash and inventory for reconciliation (checking if money matches sales).
- **Flow Tip**: Do this before any sales. If no session is open, the app reminds you!

### Kitchen (/kitchen)
- **What it is**: Helps kitchen staff prep orders, but you can oversee it.
- **What you can do**:
  - View order statuses (e.g., "Prepping" or "Done").
  - Update if needed (e.g., mark a pizza as ready).
- **Flow Tip**: Check this during busy times to see if things are moving smoothly. It uses up inventory automatically.

### Expenses (/expenses)
- **What it is**: Tracks money spent on non-ingredient things (like gas or repairs).
- **What you can do**:
  - Add an expense: Enter what it is, amount, and how paid (cash/card).
  - View lists by month or year.
- **Flow Tip**: Add these regularly for accurate profit reports.

### Reports (/reports)
- **What it is**: Detailed summaries to help you run the business better.
- **What you can do**:
  - Generate reports on sales, profits, inventory use, or expenses.
  - See charts and numbers (e.g., "We made $500 profit this month").
- **Flow Tip**: Use this at the end of the week or month to spot trends, like "We're using too much cheese."

## 5. Logging Out
- When you're done, click the "Logout" button in the top bar.
- This ends your session and keeps things secure. Always log out if leaving the device!

## 6. Tips and Best Practices
- **Daily Flow Example**: Log in > Check Dashboard > Open a Session > Handle any urgent tasks (like Purchases or Inventory) > Check Reports at end of day > Log out.
- **Common Issues**: If a page says "Not Authorized," you're in the wrong role—log in as admin. If stuck, refresh the page or ask for help.
- **Security**: Change passwords often. Don't share your login.
- **Mobile Use**: The app works on phones, but some charts are better on a bigger screen.
- **Questions?** Talk to your team or check the app's help docs. Practice in a test version first!

You're all set! This app will help make running Wheely Good Pizza easier. If you follow this guide, you'll be navigating like a pro in no time.
