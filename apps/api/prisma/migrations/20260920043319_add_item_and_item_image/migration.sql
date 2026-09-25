-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_images" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "items_store_id_idx" ON "items"("store_id");

-- CreateIndex
CREATE INDEX "item_images_item_id_idx" ON "item_images"("item_id");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
