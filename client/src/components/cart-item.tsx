import { CartItem as CartItemType } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: CartItemType;
  onIncrement: (itemId: number) => void;
  onDecrement: (itemId: number) => void;
  onRemove: (itemId: number) => void;
}

export function CartItem({ item, onIncrement, onDecrement, onRemove }: CartItemProps) {
  const { id, name, price, quantity, imageUrl } = item;
  const totalPrice = price * quantity;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center">
      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
        {imageUrl && <img src={imageUrl} alt={name} className="w-full h-full object-cover" />}
      </div>
      <div className="ml-4 flex-grow">
        <h3 className="font-medium">{name}</h3>
        <p className="text-gray-600 text-sm">{formatCurrency(price)}</p>
      </div>
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onDecrement(id)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="mx-3 min-w-[20px] text-center">{quantity}</span>
        <Button
          variant="default"
          size="icon"
          className="h-8 w-8 rounded-full bg-primary text-white"
          onClick={() => onIncrement(id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="ml-4 text-right">
        <p className="font-medium">{formatCurrency(totalPrice)}</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 text-sm"
          onClick={() => onRemove(id)}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
}
