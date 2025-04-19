import { useState } from "react";
import { FoodItem } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FoodItemCardProps {
  foodItem: FoodItem;
  onAddToCart: (foodItem: FoodItem) => void;
  onRemoveFromCart: (foodItemId: number) => void;
  quantity: number;
}

export function FoodItemCard({ 
  foodItem, 
  onAddToCart, 
  onRemoveFromCart, 
  quantity 
}: FoodItemCardProps) {
  const { id, name, description, price, imageUrl } = foodItem;

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="h-48 overflow-hidden">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium text-lg">{name}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
          <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
            {formatCurrency(price)}
          </span>
        </div>
        <div className="mt-auto pt-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onRemoveFromCart(id)}
              disabled={quantity === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="mx-3 min-w-[20px] text-center">{quantity}</span>
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full bg-primary text-white"
              onClick={() => onAddToCart(foodItem)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {quantity === 0 ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary font-medium"
              onClick={() => onAddToCart(foodItem)}
            >
              Add to Cart
            </Button>
          ) : (
            <span className="text-primary text-sm font-medium">
              {formatCurrency(price * quantity)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
