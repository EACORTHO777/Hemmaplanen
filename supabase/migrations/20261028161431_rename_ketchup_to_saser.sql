-- The category "Ketchup" is now called "Såser" (its own section on the list)
update public.shopping_items set category = 'Såser' where category = 'Ketchup';
update public.item_memory set category = 'Såser' where category = 'Ketchup';
