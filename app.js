import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Camera } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Assume plantDatabase is imported from a separate file
import { plantDatabase } from './plantDatabase';

const CELL_SIZE = 30;
const ACRE_TO_SQ_FT = 43560;
const CELL_AREA = 9 * 9; // Each cell represents 9x9 feet

const analyzePlantCompatibility = (gridState) => {
    const plantList = Object.values(gridState).flat();
    const compatibilityReport = [];
    const incompatiblePairs = [];

    for (let i = 0; i < plantList.length; i++) {
        for (let j = i + 1; j < plantList.length; j++) {
            const plant1 = plantList[i];
            const plant2 = plantList[j];

            if (plant1.companions.includes(plant2.name)) {
                compatibilityReport.push(`${plant1.name} and ${plant2.name} are good companions.`);
            } else if (!plant1.companions.includes(plant2.name) && !plant2.companions.includes(plant1.name)) {
                incompatiblePairs.push(`${plant1.name} and ${plant2.name} may not be ideal companions.`);
            }
        }
    }

    return { compatibilityReport, incompatiblePairs };
};

const getPlantRepresentation = (plant) => {
    const baseSize = CELL_SIZE / 3;
    const layerConfig = {
        'Canopy': { color: '#228B22', sizeFactor: 2.5 },
        'Sub-canopy': { color: '#32CD32', sizeFactor: 2 },
        'Shrub': { color: '#90EE90', sizeFactor: 1.5 },
        'Herbaceous': { color: '#98FB98', sizeFactor: 1 },
        'Ground Cover': { color: '#00FA9A', sizeFactor: 0.8 },
        'Vine': { color: '#3CB371', sizeFactor: 1.2 },
        'Root': { color: '#964B00', sizeFactor: 0.7 }
    };

    const config = layerConfig[plant.layer] || { color: '#000000', sizeFactor: 1 };
    return {
        color: config.color,
        size: baseSize * config.sizeFactor
    };
};

const getCompanionSuggestions = (selectedPlants) => {
    const suggestions = new Set();
    selectedPlants.forEach(plant => {
        if (plant.companions) {
            plant.companions.forEach(companion => {
                if (!selectedPlants.includes(companion)) {
                    suggestions.add(companion);
                }
            });
        }
    });
    return Array.from(suggestions);
};

const FullReportModal = ({ compatibilityAnalysis, biodiversityScore, yieldScore, verticalScore, profit, onClose }) => {
    return (
        <div className="full-report-modal">
            <h2>Food Forest Full Report</h2>
            
            <div className="score-summary">
                <h3>Scores:</h3>
                <p>Biodiversity Score: {biodiversityScore}</p>
                <p>Yield Score: {yieldScore}</p>
                <p>Vertical Score: {verticalScore}</p>
                <p>Total Profit: ${profit.toFixed(2)}</p>
            </div>

            <div className="compatibility-analysis">
                <h3>Plant Compatibility Analysis:</h3>
                {compatibilityAnalysis.compatibilityReport.length > 0 && (
                    <div className="good-companions">
                        <h4>Good Companions:</h4>
                        <ul>
                            {compatibilityAnalysis.compatibilityReport.map((report, index) => (
                                <li key={index}>{report}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {compatibilityAnalysis.incompatiblePairs.length > 0 && (
                    <div className="incompatible-pairs">
                        <h4>Potential Incompatibilities:</h4>
                        <ul>
                            {compatibilityAnalysis.incompatiblePairs.map((pair, index) => (
                                <li key={index}>{pair}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <button onClick={onClose}>Close Report</button>
        </div>
    );
};

const EconomicAnalysisTool = ({ gridState, forestAge }) => {
    const [setupCosts, setSetupCosts] = useState({
        landCost: 10000,
        soilPreparation: 2000,
        irrigation: 3000,
        initialPlants: 1000,
        tools: 500,
    });

    const [annualCosts, setAnnualCosts] = useState({
        maintenance: 1000,
        water: 500,
        additionalPlants: 200,
    });

    const [income, setIncome] = useState({});
    const [netProfit, setNetProfit] = useState(0);
    const [roi, setRoi] = useState(0);

    useEffect(() => {
        calculateIncome();
    }, [gridState, forestAge]);

    useEffect(() => {
        calculateNetProfit();
    }, [income, setupCosts, annualCosts, forestAge]);

    const calculateIncome = () => {
        const newIncome = {};
        Object.values(gridState).flat().forEach(plant => {
            const dbPlant = plantDatabase.find(p => p.id === plant.id);
            if (dbPlant) {
                const maturityFactor = Math.min(1, forestAge / dbPlant.maturityAge);
                const annualYield = dbPlant.yieldPerYear * maturityFactor;
                const plantIncome = annualYield * dbPlant.marketPrice;
                newIncome[dbPlant.name] = (newIncome[dbPlant.name] || 0) + plantIncome;
            }
        });
        setIncome(newIncome);
    };

    const calculateNetProfit = () => {
        const totalIncome = Object.values(income).reduce((sum, val) => sum + val, 0);
        const totalSetupCosts = Object.values(setupCosts).reduce((sum, val) => sum + val, 0);
        const totalAnnualCosts = Object.values(annualCosts).reduce((sum, val) => sum + val, 0);
        const profit = totalIncome - totalAnnualCosts;
        const newNetProfit = profit * forestAge - totalSetupCosts;
        setNetProfit(newNetProfit);

        const totalCosts = totalSetupCosts + totalAnnualCosts * forestAge;
        const newRoi = totalCosts > 0 ? (newNetProfit / totalCosts) * 100 : 0;
        setRoi(newRoi);
    };

    const handleSetupCostChange = (key, value) => {
        setSetupCosts(prev => ({ ...prev, [key]: Number(value) }));
    };

    const handleAnnualCostChange = (key, value) => {
        setAnnualCosts(prev => ({ ...prev, [key]: Number(value) }));
    };

    return (
        <div className="economic-analysis-tool">
            <h2>Economic Analysis</h2>
            
            <div className="cost-inputs">
                <h3>Setup Costs</h3>
                {Object.entries(setupCosts).map(([key, value]) => (
                    <div key={key}>
                        <label>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
                        <input
                            type="number"
                            value={value}
                            onChange={(e) => handleSetupCostChange(key, e.target.value)}
                        />
                    </div>
                ))}

                <h3>Annual Costs</h3>
                {Object.entries(annualCosts).map(([key, value]) => (
                    <div key={key}>
                        <label>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
                        <input
                            type="number"
                            value={value}
                            onChange={(e) => handleAnnualCostChange(key, e.target.value)}
                        />
                    </div>
                ))}
            </div>

            <div className="income-summary">
                <h3>Estimated Annual Income</h3>
                <ul>
                    {Object.entries(income).map(([plant, value]) => (
                        <li key={plant}>{plant}: ${value.toFixed(2)}</li>
                    ))}
                </ul>
                <p>Total Annual Income: ${Object.values(income).reduce((sum, val) => sum + val, 0).toFixed(2)}</p>
            </div>

            <div className="profit-summary">
                <h3>Profit Analysis (over {forestAge} years)</h3>
                <p>Net Profit: ${netProfit.toFixed(2)}</p>
                <p>Return on Investment (ROI): {roi.toFixed(2)}%</p>
            </div>
        </div>
    );
};

const FoodForestPlanner = () => {
    const [gridState, setGridState] = useState({});
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [climate, setClimate] = useState('Tropical');
    const [forestAge, setForestAge] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLayer, setSelectedLayer] = useState('All');
    const [score, setScore] = useState(0);
    const [profit, setProfit] = useState(0);
    const [biodiversityScore, setBiodiversityScore] = useState(0);
    const [yieldScore, setYieldScore] = useState(0);
    const [verticalScore, setVerticalScore] = useState(0);
    const [currentTool, setCurrentTool] = useState('plant');
    const [showModal, setShowModal] = useState(false);
    const [modalPlant, setModalPlant] = useState(null);
    const [propertySize, setPropertySize] = useState(1);
    const [gridSize, setGridSize] = useState(21);
    const canvasRef = useRef(null);
    const [sizeMode, setSizeMode] = useState('acre');
    const [customLength, setCustomLength] = useState(0);
    const [customWidth, setCustomWidth] = useState(0);
    const [companionSuggestions, setCompanionSuggestions] = useState([]);
    const [compatibilityAnalysis, setCompatibilityAnalysis] = useState({ compatibilityReport: [], incompatiblePairs: [] });

    useEffect(() => {
        drawGrid();
        updateCompanionSuggestions();
    }, [gridState, gridSize]);

    useEffect(() => {
        updateGridSize();
    }, [propertySize, sizeMode, customLength, customWidth]);

    useEffect(() => {
        const analysis = analyzePlantCompatibility(gridState);
        setCompatibilityAnalysis(analysis);
    }, [gridState]);

    const updateGridSize = () => {
        let newGridSize;
        if (sizeMode === 'acre') {
            const squareFeet = propertySize * ACRE_TO_SQ_FT;
            newGridSize = Math.floor(Math.sqrt(squareFeet / CELL_AREA));
        } else {
            newGridSize = Math.floor(Math.min(customLength, customWidth) / 9);
        }
        newGridSize = Math.max(newGridSize, 1);
        setGridSize(newGridSize);
        setGridState({});
    };

    const drawGrid = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#ccc';
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, gridSize * CELL_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(gridSize * CELL_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }

        Object.entries(gridState).forEach(([key, plants]) => {
            const [x, y] = key.split(',').map(Number);
            plants.forEach((plant, index) => {
                const { color, size } = getPlantRepresentation(plant);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(
                    x * CELL_SIZE + CELL_SIZE / 2,
                    y * CELL_SIZE + CELL_SIZE / 2 + index * 5,
                    size,
                    0,
                    2 * Math.PI
                );
                ctx.fill();

                ctx.fillStyle = 'white';
                ctx.font = `${size}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    plant.symbol,
                    x * CELL_SIZE + CELL_SIZE / 2,
                    y * CELL_SIZE + CELL_SIZE / 2 + index * 5
                );
            });
        });
    };

    const updateCompanionSuggestions = () => {
        const selectedPlants = Object.values(gridState).flat().map(plant => plant.name);
        const suggestions = getCompanionSuggestions(selectedPlants);
        setCompanionSuggestions(suggestions);
    };

    const calculateScores = () => {
        const plants = Object.values(gridState).flat();
        
        const uniqueSpecies = new Set(plants.map(p => p.name)).size;
        const layersUsed = new Set(plants.map(p => p.layer)).size;
        const newBiodiversityScore = uniqueSpecies * 10 + (layersUsed === 7 ? 50 : 0);

        const totalYield = plants.reduce((sum, plant) => {
            const maturityFactor = Math.min(1, (forestAge / plant.maturityAge));
            return sum + (plant.yieldPerYear * maturityFactor);
        }, 0);
        const newYieldScore = Math.floor(totalYield);

        const layerCounts = plants.reduce((count, plant) => {
            count[plant.layer] = (count[plant.layer] || 0) + 1;
            return count;
        }, {});
        const newVerticalScore = Object.values(layerCounts).reduce((score, count) => score + Math.min(count, 5) * 10, 0);

        setBiodiversityScore(newBiodiversityScore);
        setYieldScore(newYieldScore);
        setVerticalScore(newVerticalScore);

        const newProfit = calculateProfit();
        setProfit(newProfit);

        return newBiodiversityScore + newYieldScore + newVerticalScore;
    };

    const calculateProfit = () => {
        const totalIncome = Object.values(gridState).flat().reduce((sum, plant) => {
            const maturityFactor = Math.min(1, (forestAge / plant.maturityAge));
            return sum + (plant.yieldPerYear * maturityFactor * plant.marketPrice);
        }, 0);

        const setupCost = 1000;
        const annualCost = 500;

        const totalCost = setupCost + (annualCost * forestAge);
        return totalIncome * forestAge - totalCost;
    };

    const handleCanvasClick = (event) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);
        const key = `${x},${y}`;

        if (currentTool === 'plant' && selectedPlant) {
            setGridState(prevState => {
                const currentPlants = prevState[key] || [];
                const layerCapacity = {
                    'Canopy': 1,
                    'Shrub': 4,
                    'Root': 7
                };
                const capacity = layerCapacity[selectedPlant.layer] || 7;
                
                if (currentPlants.filter(p => p.layer === selectedPlant.layer).length < capacity) {
                    return {
                        ...prevState,
                        [key]: [...currentPlants, selectedPlant]
                    };
                }
                return prevState;
            });
            updateCompanionSuggestions();
        } else if (currentTool === 'eraser') {
            setGridState(prevState => {
                const { [key]: _, ...newState } = prevState;
                return newState;
            });
            updateCompanionSuggestions();
        } else if (currentTool === 'info') {
            const plantsAtLocation = gridState[key] || [];
            if (plantsAtLocation.length > 0) {
                setModalPlant(plantsAtLocation[plantsAtLocation.length - 1]);
                setShowModal(true);
            }
        }

        const newTotalScore = calculateScores();
        setScore(newTotalScore);
    };

    const exportSVG = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const svgString = `
            <svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="white"/>
                ${Object.entries(gridState).map(([key, plants]) => {
                    const [x, y] = key.split(',').map(Number);
                    return plants.map((plant, index) => {
                        const { color, size } = getPlantRepresentation(plant);
                        return `
                            <circle cx="${x * CELL_SIZE + CELL_SIZE / 2}" cy="${y * CELL_SIZE + CELL_SIZE / 2 + index * 5}" r="${size}" fill="${color}"/>
                            <text x="${x * CELL_SIZE + CELL_SIZE / 2}" y="${y * CELL_SIZE + CELL_SIZE / 2 + index * 5}" font-family="Arial" font-size="${size}" fill="white" text-anchor="middle" dominant-baseline="middle">${plant.symbol}</text>
                        `;
                    }).join('');
                }).join('')}
            </svg>
        `;

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'food_forest_plan.svg';
        link.click();
    };

    const exportJPG = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg');
        link.download = 'food_forest_plan.jpg';
        link.click();
    };

    const downloadCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "X,Y,Plant Name,Layer\n";

        Object.entries(gridState).forEach(([key, plants]) => {
            const [x, y] = key.split(',');
            plants.forEach(plant => {
                csvContent += `${x},${y},${plant.name},${plant.layer}\n`;
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "food_forest_coordinates.csv");
        document.body.appendChild(link);
        link.click();
    };

    const filteredPlants = plantDatabase
        .filter(plant => plant.climate === climate)
        .filter(plant => plant.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(plant => selectedLayer === 'All' || plant.layer === selectedLayer);

    return (
        <div className="container">
            <h1>Food Forest Planner</h1>

            <div className="compatibility-feedback">
                <h3>Planting Arrangement Feedback</h3>
                <p>Total Score: {score}</p>
                <p>Biodiversity Score: {biodiversityScore}</p>
                <p>Yield Score: {yieldScore}</p>
                <p>Vertical Score: {verticalScore}</p>
                <p>Profit: ${profit.toFixed(2)}</p>
                <button onClick={exportSVG}>Export as SVG</button>
                <button onClick={exportJPG}>Export as JPG</button>
                <button onClick={() => setShowModal(true)}>View Full Report</button>
                {compatibilityAnalysis.compatibilityReport.length > 0 && (
                    <div className="good-companions">
                        <h4>Good Companions:</h4>
                        <ul>
                            {compatibilityAnalysis.compatibilityReport.map((report, index) => (
                                <li key={index}>{report}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {compatibilityAnalysis.incompatiblePairs.length > 0 && (
                    <div className="incompatible-pairs">
                        <h4>Potential Incompatibilities:</h4>
                        <ul>
                            {compatibilityAnalysis.incompatiblePairs.map((pair, index) => (
                                <li key={index}>{pair}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="tool-selection">
                <button onClick={() => setCurrentTool('plant')} className={currentTool === 'plant' ? 'active' : ''}>Plant</button>
                <button onClick={() => setCurrentTool('eraser')} className={currentTool === 'eraser' ? 'active' : ''}>Eraser</button>
                <button onClick={() => setCurrentTool('info')} className={currentTool === 'info' ? 'active' : ''}>Info</button>
            </div>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search for plants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <select value={climate} onChange={(e) => setClimate(e.target.value)}>
                <option value="Tropical">Tropical</option>
                <option value="Subtropical">Subtropical</option>
                <option value="Temperate">Temperate</option>
            </select>

            <select value={selectedLayer} onChange={(e) => setSelectedLayer(e.target.value)}>
                <option value="All">All Layers</option>
                <option value="Canopy">Canopy</option>
                <option value="Sub-canopy">Sub-canopy</option>
                <option value="Shrub">Shrub</option>
                <option value="Herbaceous">Herbaceous</option>
                <option value="Ground Cover">Ground Cover</option>
                <option value="Vine">Vine</option>
                <option value="Root">Root</option>
            </select>

            <div className="grid">
                <div className="plant-selection">
                    {filteredPlants.map(plant => (
                        <button
                            key={plant.id}
                            className={selectedPlant && selectedPlant.id === plant.id ? 'selected' : ''}
                            onClick={() => setSelectedPlant(plant)}
                        >
                            {plant.name} ({plant.layer})
                        </button>
                    ))}
                </div>
                <canvas
                    ref={canvasRef}
                    width={gridSize * CELL_SIZE}
                    height={gridSize * CELL_SIZE}
                    onClick={handleCanvasClick}
                    style={{ border: '1px solid black' }}
                />
            </div>

            <div id="companion-suggestions" className="companion-suggestions">
                <h3>Companion Plant Suggestions:</h3>
                {companionSuggestions.map((plant, index) => (
                    <span key={index} className="companion-suggestion" onClick={() => setSelectedPlant(plantDatabase.find(p => p.name === plant))}>
                        {plant}
                    </span>
                ))}
            </div>

            <div className="slider-container">
                <label htmlFor="forest-age">Forest Age: {forestAge} years</label>
                <input
                    id="forest-age"
                    type="range"
                    min="1"
                    max="50"
                    value={forestAge}
                    onChange={(e) => setForestAge(Number(e.target.value))}
                    className="slider"
                />
            </div>

            <div className="property-size-container">
                <label htmlFor="size-mode">Size Mode:</label>
                <select id="size-mode" value={sizeMode} onChange={(e) => setSizeMode(e.target.value)}>
                    <option value="acre">Acre</option>
                    <option value="custom">Custom</option>
                </select>
                {sizeMode === 'acre' && (
                    <div>
                        <label htmlFor="property-size">Property Size (in acres):</label>
                        <input
                            id="property-size"
                            type="number"
                            value={propertySize}
                            onChange={(e) => setPropertySize(Number(e.target.value))}
                            min="0.1"
                            step="0.1"
                        />
                    </div>
                )}
                {sizeMode === 'custom' && (
                    <div>
                        <label htmlFor="custom-length">Length (in feet):</label>
                        <input
                            id="custom-length"
                            type="number"
                            value={customLength}
                            onChange={(e) => setCustomLength(Number(e.target.value))}
                            min="9"
                            step="9"
                        />
                        <label htmlFor="custom-width">Width (in feet):</label>
                        <input
                            id="custom-width"
                            type="number"
                            value={customWidth}
                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                            min="9"
                            step="9"
                        />
                    </div>
                )}
            </div>

            <EconomicAnalysisTool
                gridState={gridState}
                forestAge={forestAge}
            />

            <div className="export-buttons">
                <button onClick={exportSVG}>Export as SVG</button>
                <button onClick={exportJPG}>Export as JPG</button>
                <button onClick={downloadCSV}>Export Coordinates as CSV</button> 
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowModal(false)}>&times;</span>
                        {modalPlant ? (
                            <div className="plant-info">
                                <img src={modalPlant.image} alt={modalPlant.name} />
                                <div className="plant-details">
                                    <h2>{modalPlant.name}</h2>
                                    <p>{modalPlant.description}</p>
                                    <ul>
                                        <li><strong>Climate:</strong> {modalPlant.climate}</li>
                                        <li><strong>Layer:</strong> {modalPlant.layer}</li>
                                        <li><strong>Yield per Year:</strong> {modalPlant.yieldPerYear} {modalPlant.unit}</li>
                                        <li><strong>Market Price:</strong> ${modalPlant.marketPrice} per {modalPlant.unit}</li>
                                        <li><strong>Maturity Age:</strong> {modalPlant.maturityAge} years</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <FullReportModal
                                compatibilityAnalysis={compatibilityAnalysis}
                                biodiversityScore={biodiversityScore}
                                yieldScore={yieldScore}
                                verticalScore={verticalScore}
                                profit={profit}
                                onClose={() => setShowModal(false)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoodForestPlanner;