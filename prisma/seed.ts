import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const connectionString = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default site settings (single row)
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        buyLinkUrl: "https://www.etsy.com",
        buyLinkLabel: "Order on Etsy",
        savedDesignExpiryDays: 30,
      },
    });
  }

  // Create sample categories
  const basket = await prisma.category.upsert({
    where: { slug: "basket" },
    update: {},
    create: {
      name: "Basket",
      slug: "basket",
      displayOrder: 0,
    },
  });

  const backpack = await prisma.category.upsert({
    where: { slug: "backpack" },
    update: {},
    create: {
      name: "Backpack",
      slug: "backpack",
      displayOrder: 1,
    },
  });

  const sweater = await prisma.category.upsert({
    where: { slug: "sweater" },
    update: {},
    create: {
      name: "Sweater",
      slug: "sweater",
      displayOrder: 2,
    },
  });

  // Basket: size (XS, S, M, L, XL) + color (Natural, Brown) - each variant has unique image
  const basketSizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];
  const basketColors = [
    { value: "natural", label: "Natural", image: "/placeholder-product.svg" },
    { value: "brown", label: "Brown", image: "/placeholder-product.svg" },
  ];
  await prisma.productVariant.deleteMany({ where: { categoryId: basket.id } });
  for (const color of basketColors) {
    for (const size of basketSizes) {
      await prisma.productVariant.create({
        data: {
          categoryId: basket.id,
          imageUrl: color.image,
          optionValues: { size, color: color.value },
        },
      });
    }
  }

  // Backpack: color variants with separate images
  const backpackVariants = [
    { color: "green", image: "/placeholder-product.svg" },
    { color: "pink", image: "/placeholder-product.svg" },
    { color: "blue", image: "/placeholder-product.svg" },
    { color: "gray", image: "/placeholder-product.svg" },
  ];
  await prisma.productVariant.deleteMany({ where: { categoryId: backpack.id } });
  for (const v of backpackVariants) {
    await prisma.productVariant.create({
      data: {
        categoryId: backpack.id,
        imageUrl: v.image,
        optionValues: { color: v.color },
      },
    });
  }

  // Sweater: size (S, M, L, XL) + color (Cream, Navy, Red) - each variant has unique image
  const sweaterSizes = ["S", "M", "L", "XL"];
  const sweaterColors = [
    { value: "cream", label: "Cream", image: "/placeholder-product.svg" },
    { value: "navy", label: "Navy", image: "/placeholder-product.svg" },
    { value: "red", label: "Red", image: "/placeholder-product.svg" },
  ];
  await prisma.productVariant.deleteMany({ where: { categoryId: sweater.id } });
  for (const color of sweaterColors) {
    for (const size of sweaterSizes) {
      await prisma.productVariant.create({
        data: {
          categoryId: sweater.id,
          imageUrl: color.image,
          optionValues: { size, color: color.value },
        },
      });
    }
  }

  // Create option groups for basket
  let basketSizeGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: basket.id, type: "size" },
  });
  if (!basketSizeGroup) {
    basketSizeGroup = await prisma.optionGroup.create({
      data: {
        categoryId: basket.id,
        type: "size",
        label: "Choose a basket size",
        config: {},
        displayOrder: 1,
      },
    });
  }
  await prisma.optionValue.deleteMany({ where: { optionGroupId: basketSizeGroup.id } });
  await prisma.optionValue.createMany({
    data: [
      { optionGroupId: basketSizeGroup.id, label: "XXS", value: "XXS", displayOrder: 0 },
      { optionGroupId: basketSizeGroup.id, label: "XS", value: "XS", displayOrder: 1 },
      { optionGroupId: basketSizeGroup.id, label: "S", value: "S", displayOrder: 2 },
      { optionGroupId: basketSizeGroup.id, label: "M", value: "M", displayOrder: 3 },
      { optionGroupId: basketSizeGroup.id, label: "L", value: "L", displayOrder: 4 },
      { optionGroupId: basketSizeGroup.id, label: "XL", value: "XL", displayOrder: 5 },
      { optionGroupId: basketSizeGroup.id, label: "XXL", value: "XXL", displayOrder: 6 },
    ],
  });

  let basketColorGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: basket.id, type: "productColor" },
  });
  if (!basketColorGroup) {
    basketColorGroup = await prisma.optionGroup.create({
      data: {
        categoryId: basket.id,
        type: "productColor",
        label: "Choose color",
        config: {},
        displayOrder: 0,
      },
    });
  }
  await prisma.optionValue.deleteMany({ where: { optionGroupId: basketColorGroup.id } });
  await prisma.optionValue.createMany({
    data: [
      { optionGroupId: basketColorGroup.id, label: "Natural", value: "natural", displayOrder: 0 },
      { optionGroupId: basketColorGroup.id, label: "Brown", value: "brown", displayOrder: 1 },
    ],
  });

  let basketTextGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: basket.id, type: "text" },
  });
  if (!basketTextGroup) {
    basketTextGroup = await prisma.optionGroup.create({
      data: {
        categoryId: basket.id,
        type: "text",
        label: "Custom text",
        config: { maxLength: 15 },
        displayOrder: 1,
      },
    });
  }

  let basketYarnGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: basket.id, type: "yarnColor" },
  });
  if (!basketYarnGroup) {
    basketYarnGroup = await prisma.optionGroup.create({
      data: {
        categoryId: basket.id,
        type: "yarnColor",
        label: "Choose a yarn color",
        config: {},
        displayOrder: 2,
      },
    });
    const basketYarnColors = [
      { label: "Navy", value: "#1e3a5f" },
      { label: "Brown", value: "#92400e" },
      { label: "Green", value: "#16a34a" },
      { label: "Black", value: "#171717" },
    ];
    for (let i = 0; i < basketYarnColors.length; i++) {
      await prisma.optionValue.create({
        data: {
          optionGroupId: basketYarnGroup.id,
          label: basketYarnColors[i].label,
          value: basketYarnColors[i].value,
          displayOrder: i,
        },
      });
    }
  }

  let basketIconsGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: basket.id, type: "icons" },
  });
  if (!basketIconsGroup) {
    basketIconsGroup = await prisma.optionGroup.create({
      data: {
        categoryId: basket.id,
        type: "icons",
        label: "Choose up to 2 icons",
        config: { maxIcons: 2 },
        displayOrder: 3,
      },
    });
    const basketIcons = [
      { label: "Heart", value: "/icons/heart.svg" },
      { label: "Star", value: "/icons/star.svg" },
      { label: "Flower", value: "/icons/flower.svg" },
    ];
    for (let i = 0; i < basketIcons.length; i++) {
      await prisma.optionValue.create({
        data: {
          optionGroupId: basketIconsGroup.id,
          label: basketIcons[i].label,
          value: basketIcons[i].value,
          displayOrder: i,
        },
      });
    }
  }

  // Create option groups for backpack
  let textGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: backpack.id, type: "text" },
  });
  if (!textGroup) {
    textGroup = await prisma.optionGroup.create({
      data: {
        categoryId: backpack.id,
        type: "text",
        label: "Custom text",
        config: { maxLength: 20 },
        displayOrder: 0,
      },
    });
  }

  let colorGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: backpack.id, type: "productColor" },
  });
  if (!colorGroup) {
    colorGroup = await prisma.optionGroup.create({
      data: {
        categoryId: backpack.id,
        type: "productColor",
        label: "Choose a backpack color",
        config: {},
        displayOrder: 1,
      },
    });
  }
  await prisma.optionValue.deleteMany({ where: { optionGroupId: colorGroup.id } });
  await prisma.optionValue.createMany({
    data: [
      { optionGroupId: colorGroup.id, label: "Green", value: "green", displayOrder: 0 },
      { optionGroupId: colorGroup.id, label: "Pink", value: "pink", displayOrder: 1 },
      { optionGroupId: colorGroup.id, label: "Blue", value: "blue", displayOrder: 2 },
      { optionGroupId: colorGroup.id, label: "Gray", value: "gray", displayOrder: 3 },
    ],
  });

  let popularGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: backpack.id, type: "popularColor" },
  });
  if (!popularGroup) {
    popularGroup = await prisma.optionGroup.create({
      data: {
        categoryId: backpack.id,
        type: "popularColor",
        label: "Popular colors",
        config: {},
        displayOrder: 2,
      },
    });
    const popularColors = [
      { label: "Navy", value: "#1e3a5f" },
      { label: "Light Pink", value: "#fbcfe8" },
      { label: "Light Blue", value: "#93c5fd" },
      { label: "Brown", value: "#92400e" },
      { label: "Grey", value: "#6b7280" },
      { label: "Hot Pink", value: "#ec4899" },
      { label: "Green", value: "#16a34a" },
      { label: "White", value: "#fafafa" },
    ];
    for (let i = 0; i < popularColors.length; i++) {
      await prisma.optionValue.create({
        data: {
          optionGroupId: popularGroup.id,
          label: popularColors[i].label,
          value: popularColors[i].value,
          displayOrder: i,
        },
      });
    }
  }

  let yarnGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: backpack.id, type: "yarnColor" },
  });
  if (!yarnGroup) {
    yarnGroup = await prisma.optionGroup.create({
      data: {
        categoryId: backpack.id,
        type: "yarnColor",
        label: "Choose a yarn color below",
        config: {},
        displayOrder: 3,
      },
    });
  }
  await prisma.optionValue.deleteMany({ where: { optionGroupId: yarnGroup.id } });
  const yarnColors = [
    { label: "Navy", value: "#1e3a5f" },
    { label: "Red", value: "#dc2626" },
    { label: "Green", value: "#16a34a" },
    { label: "Black", value: "#171717" },
    { label: "White", value: "#fafafa" },
    { label: "Purple", value: "#7c3aed" },
  ];
  for (let i = 0; i < yarnColors.length; i++) {
    await prisma.optionValue.create({
      data: {
        optionGroupId: yarnGroup.id,
        label: yarnColors[i].label,
        value: yarnColors[i].value,
        displayOrder: i,
      },
    });
  }

  let multiColorGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: backpack.id, type: "multiColor" },
  });
  if (!multiColorGroup) {
    multiColorGroup = await prisma.optionGroup.create({
      data: {
        categoryId: backpack.id,
        type: "multiColor",
        label: "Multi colors",
        config: {},
        displayOrder: 4,
      },
    });
    await prisma.optionValue.createMany({
      data: [
        {
          optionGroupId: multiColorGroup.id,
          label: "Multicolor 1",
          value: JSON.stringify(["#f9a8d4", "#c4b5fd", "#fef08a", "#fdba74", "#93c5fd", "#86efac"]),
          displayOrder: 0,
        },
        {
          optionGroupId: multiColorGroup.id,
          label: "Multicolor 2",
          value: JSON.stringify(["#93c5fd", "#3b82f6", "#c4b5fd", "#a5b4fc", "#9ca3af", "#fef08a"]),
          displayOrder: 1,
        },
      ],
    });
  }

  let iconsGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: backpack.id, type: "icons" },
  });
  if (!iconsGroup) {
    iconsGroup = await prisma.optionGroup.create({
      data: {
        categoryId: backpack.id,
        type: "icons",
        label: "Choose up to 2 icons",
        config: { maxIcons: 2 },
        displayOrder: 5,
      },
    });
    const icons = [
      { label: "Heart", value: "/icons/heart.svg" },
      { label: "Star", value: "/icons/star.svg" },
      { label: "Flower", value: "/icons/flower.svg" },
    ];
    for (let i = 0; i < icons.length; i++) {
      await prisma.optionValue.create({
        data: {
          optionGroupId: iconsGroup.id,
          label: icons[i].label,
          value: icons[i].value,
          displayOrder: i,
        },
      });
    }
  }

  // Create option groups for sweater
  let sweaterSizeGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: sweater.id, type: "size" },
  });
  if (!sweaterSizeGroup) {
    sweaterSizeGroup = await prisma.optionGroup.create({
      data: {
        categoryId: sweater.id,
        type: "size",
        label: "Choose a size",
        config: {},
        displayOrder: 0,
      },
    });
  }
  await prisma.optionValue.deleteMany({ where: { optionGroupId: sweaterSizeGroup.id } });
  await prisma.optionValue.createMany({
    data: [
      { optionGroupId: sweaterSizeGroup.id, label: "S", value: "S", displayOrder: 0 },
      { optionGroupId: sweaterSizeGroup.id, label: "M", value: "M", displayOrder: 1 },
      { optionGroupId: sweaterSizeGroup.id, label: "L", value: "L", displayOrder: 2 },
      { optionGroupId: sweaterSizeGroup.id, label: "XL", value: "XL", displayOrder: 3 },
    ],
  });

  let sweaterColorGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: sweater.id, type: "productColor" },
  });
  if (!sweaterColorGroup) {
    sweaterColorGroup = await prisma.optionGroup.create({
      data: {
        categoryId: sweater.id,
        type: "productColor",
        label: "Choose color",
        config: {},
        displayOrder: 0,
      },
    });
  }
  await prisma.optionValue.deleteMany({ where: { optionGroupId: sweaterColorGroup.id } });
  await prisma.optionValue.createMany({
    data: [
      { optionGroupId: sweaterColorGroup.id, label: "Cream", value: "cream", displayOrder: 0 },
      { optionGroupId: sweaterColorGroup.id, label: "Navy", value: "navy", displayOrder: 1 },
      { optionGroupId: sweaterColorGroup.id, label: "Red", value: "red", displayOrder: 2 },
    ],
  });

  let sweaterTextGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: sweater.id, type: "text" },
  });
  if (!sweaterTextGroup) {
    sweaterTextGroup = await prisma.optionGroup.create({
      data: {
        categoryId: sweater.id,
        type: "text",
        label: "Custom text",
        config: { maxLength: 20 },
        displayOrder: 1,
      },
    });
  }

  let sweaterYarnGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: sweater.id, type: "yarnColor" },
  });
  if (!sweaterYarnGroup) {
    sweaterYarnGroup = await prisma.optionGroup.create({
      data: {
        categoryId: sweater.id,
        type: "yarnColor",
        label: "Choose a yarn color",
        config: {},
        displayOrder: 2,
      },
    });
    const sweaterYarnColors = [
      { label: "Navy", value: "#1e3a5f" },
      { label: "Red", value: "#dc2626" },
      { label: "Green", value: "#16a34a" },
      { label: "Cream", value: "#fef3c7" },
      { label: "Black", value: "#171717" },
    ];
    for (let i = 0; i < sweaterYarnColors.length; i++) {
      await prisma.optionValue.create({
        data: {
          optionGroupId: sweaterYarnGroup.id,
          label: sweaterYarnColors[i].label,
          value: sweaterYarnColors[i].value,
          displayOrder: i,
        },
      });
    }
  }

  let sweaterIconsGroup = await prisma.optionGroup.findFirst({
    where: { categoryId: sweater.id, type: "icons" },
  });
  if (!sweaterIconsGroup) {
    sweaterIconsGroup = await prisma.optionGroup.create({
      data: {
        categoryId: sweater.id,
        type: "icons",
        label: "Choose up to 2 icons",
        config: { maxIcons: 2 },
        displayOrder: 3,
      },
    });
    const sweaterIcons = [
      { label: "Heart", value: "/icons/heart.svg" },
      { label: "Star", value: "/icons/star.svg" },
      { label: "Flower", value: "/icons/flower.svg" },
    ];
    for (let i = 0; i < sweaterIcons.length; i++) {
      await prisma.optionValue.create({
        data: {
          optionGroupId: sweaterIconsGroup.id,
          label: sweaterIcons[i].label,
          value: sweaterIcons[i].value,
          displayOrder: i,
        },
      });
    }
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
