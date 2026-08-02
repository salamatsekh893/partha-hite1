import { SolarProduct, OfferItem } from '../types.js';

export const INITIAL_PRODUCTS: SolarProduct[] = [
  {
    id: 1,
    name: "535W Mono PERC High-Efficiency Solar Panel",
    category: "Solar Panels",
    mrp: 18500,
    distributorPrice: 14200,
    businessValue: 10000,
    pointValue: 100,
    image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80",
    isUpcoming: false,
    description: "High-power monocrystalline PERC module designed for residential and commercial rooftop solar installations with 21.5% efficiency."
  },
  {
    id: 2,
    name: "3kW On-Grid Solar Inverter Pro",
    category: "Inverters",
    mrp: 38000,
    distributorPrice: 29500,
    businessValue: 22000,
    pointValue: 220,
    image: "https://images.unsplash.com/photo-1558441719-670b357021bc?w=600&auto=format&fit=crop&q=80",
    isUpcoming: false,
    description: "Dual MPPT smart grid-tied inverter with built-in Wi-Fi monitoring and high surge protection for maximum energy output."
  },
  {
    id: 3,
    name: "5kW Hybrid Solar Inverter (Grid & Battery)",
    category: "Inverters",
    mrp: 65000,
    distributorPrice: 52000,
    businessValue: 40000,
    pointValue: 400,
    image: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=600&auto=format&fit=crop&q=80",
    isUpcoming: false,
    description: "Premium hybrid solar inverter compatible with Lithium batteries and grid power backup for uninterrupted 24/7 power supply."
  },
  {
    id: 4,
    name: "5HP Submersible Solar Water Pump System",
    category: "Solar Pumps",
    mrp: 145000,
    distributorPrice: 115000,
    businessValue: 85000,
    pointValue: 850,
    image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop&q=80",
    isUpcoming: false,
    description: "Heavy-duty agricultural solar pump system complete with MPPT pump controller and solar mounting kit."
  },
  {
    id: 5,
    name: "150Ah 48V Lithium-ion Solar Battery",
    category: "Batteries",
    mrp: 32000,
    distributorPrice: 24800,
    businessValue: 18000,
    pointValue: 180,
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80",
    isUpcoming: false,
    description: "Long lifespan LiFePO4 battery pack with 5000+ deep cycles and 10-year service life warranty."
  },
  {
    id: 6,
    name: "60W All-in-One Solar Street Light with Motion Sensor",
    category: "Street Lights",
    mrp: 8500,
    distributorPrice: 6200,
    businessValue: 4500,
    pointValue: 45,
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80",
    isUpcoming: false,
    description: "Integrated solar lighting solution with automatic night sensor, PIR motion detection, and IP67 waterproof body."
  },
  {
    id: 7,
    name: "700W Bifacial TOPCon Ultra Solar Module",
    category: "Solar Panels",
    mrp: 26000,
    distributorPrice: 20500,
    businessValue: 15000,
    pointValue: 150,
    image: "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop&q=80",
    isUpcoming: true,
    description: "Next-generation dual-glass bifacial TOPCon solar panel generating energy from both front and rear surfaces (+25% gain)."
  },
  {
    id: 8,
    name: "Smart SolarEV Ultra Fast Charging Station",
    category: "EV Chargers",
    mrp: 180000,
    distributorPrice: 140000,
    businessValue: 110000,
    pointValue: 1100,
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80",
    isUpcoming: true,
    description: "Commercial Grade 30kW DC Fast Charger powered directly by solar PV array with payment gateway integration."
  },
  {
    id: 9,
    name: "Solar Rooftop Micro-Inverter 1.2kW",
    category: "Inverters",
    mrp: 22000,
    distributorPrice: 17500,
    businessValue: 12500,
    pointValue: 125,
    image: "https://images.unsplash.com/photo-1558441719-670b357021bc?w=600&auto=format&fit=crop&q=80",
    isUpcoming: true,
    description: "Individual panel level micro-inverter system ensuring shade tolerance and maximum safety for residential rooftops."
  }
];

export const INITIAL_OFFERS: OfferItem[] = [
  {
    id: "OFF-101",
    title: "50,000 BV Direct Distributor Achiever Offer",
    reward: "Free Professional Solar Installation Toolkit + ₹5,000 Cash Bonus",
    criteria: "Achieve 50,000 Direct Business Value (BV) from new distributor signups.",
    validTill: "31 Aug 2026",
    badge: "Hot Promotion",
    progressPercent: 65,
    category: "Direct Bonus"
  },
  {
    id: "OFF-102",
    title: "Leadership Retreat Achiever Challenge",
    reward: "3 Days / 2 Nights All-Inclusive Resort Leadership Workshop in Jaipur",
    criteria: "Build a total team downline volume of 2,000 Point Value (PV).",
    validTill: "15 Sep 2026",
    badge: "Retreat Award",
    progressPercent: 40,
    category: "Team PV"
  },
  {
    id: "OFF-103",
    title: "5kW Solar Kit Top Seller Incentive",
    reward: "Extra 15% Matching Royalty Royalty Royalty Bonus on Team Sales",
    criteria: "Sell 5 Units of 5kW Solar Kits through direct team downline.",
    validTill: "30 Aug 2026",
    badge: "Royalty Booster",
    progressPercent: 80,
    category: "Product Achiever"
  },
  {
    id: "OFF-104",
    title: "Monsoon Double Point Value (2X PV) Booster",
    reward: "Earn Double PV on all 150Ah Lithium Battery & Inverter Orders",
    criteria: "Order qualifying battery systems during the promotional window.",
    validTill: "25 Aug 2026",
    badge: "2X PV Bonus",
    progressPercent: 100,
    category: "Special Booster"
  }
];
