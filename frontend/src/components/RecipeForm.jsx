import { useState, useEffect } from 'react';
import API from '../api';
import { toTitleCase } from '../utils/formatText';

const RecipeForm = ({ onRecipeAdded }) => {
  const [ingredients, setIngredients] = useState([]);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  useEffect(() => {
    API.get('/api/ingredients').then(res => setIngredients(res.data));
  }, []);

  const addIngredientToRecipe = (ing) => {
    setRecipeIngredients([...recipeIngredients, { ingredientId: ing._id, name: toTitleCase(ing.name), quantityUsed: '' }]);
  };

  const handleSave = async () => {
    const data = { productName, price, ingredients: recipeIngredients };
    await API.post('/api/recipes', data);
    alert("Recipe Saved!");
    setProductName(''); setPrice(''); setRecipeIngredients([]);
  };

  return (
    <div className="p-6 bg-white rounded shadow-md mt-6">
      <h2 className="text-xl font-bold mb-4">Create New Product (Recipe)</h2>
      <div className="flex gap-4 mb-4">
        <input placeholder="Product Name" className="border p-2 flex-1" value={productName} onChange={e => setProductName(e.target.value)} />
        <input placeholder="Selling Price" type="number" className="border p-2 w-32" value={price} onChange={e => setPrice(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded bg-gray-50">
          <h3 className="font-bold mb-2">1. Click to add Ingredients</h3>
          {ingredients.map(ing => (
            <button key={ing._id} onClick={() => addIngredientToRecipe(ing)} className="block w-full text-left p-1 hover:bg-blue-100">+ {toTitleCase(ing.name)}</button>
          ))}
        </div>

        <div className="border p-4 rounded bg-blue-50">
          <h3 className="font-bold mb-2">2. Enter Quantities (grams)</h3>
          {recipeIngredients.map((item, index) => (
            <div key={index} className="flex justify-between mb-2">
              <span>{toTitleCase(item.name)}</span>
              <input 
                type="number" 
                className="w-20 border px-1" 
                placeholder="Qty"
                onChange={(e) => {
                  const updated = [...recipeIngredients];
                  updated[index].quantityUsed = e.target.value;
                  setRecipeIngredients(updated);
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleSave} className="w-full bg-green-600 text-white mt-4 p-2 rounded">Save Recipe</button>
    </div>
  );
};

export default RecipeForm;