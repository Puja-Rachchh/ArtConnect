imp

const ShippingDetails = () => {
  return (
    <div>
      <h2>Shipping Details</h2>
      <p>Please provide your shipping information below:</p>
      <form>
        <div>
          <label htmlFor="address">Address:</label>
          <input type="text" id="address" name="address" required />
        </div>
        <div>
          <label htmlFor="city">City:</label>
          <input type="text" id="city" name="city" required />
        </div>
        <div>
          <label htmlFor="state">State:</label>
          <input type="text" id="state" name="state" required />
        </div>
        <div>
          <label htmlFor="zip">Zip Code:</label>
          <input type="text" id="zip" name="zip" required />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ShippingDetails;