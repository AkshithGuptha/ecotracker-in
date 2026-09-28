# TODO: Implement NGO Products in User Redeem Section

## Tasks
- [x] Update models/Product.js to include price, link, quantity, ngoId, ngoName fields
- [x] Update src/pages/ngo/AddProduct.tsx to add price and link input fields and use API for submission
- [x] Update routes/products.js to include link in schema and API handling
- [x] Modify src/pages/user/RedeemPage.tsx to fetch products from /api/products and display additional details like price, link, ngoName
- [x] Test product submission with new fields
- [x] Verify products appear in redeem section with details
- [x] Ensure MongoDB storage
