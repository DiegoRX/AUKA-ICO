import React from "react";
import Select from "react-select";

// Opciones con imagen y precio
const TokenSelect = ({ selectedToken, onChange, prices }) => {
    const options = [
        {
            value: "ONDK",
            label: "ONDK",
            price: prices.ONDK?.toFixed(2),
            image: "https://www.vetawallet.com/_next/image?url=%2Foknd.png&w=48&q=75",
        },
        {
            value: "AGKA",
            label: "AGKA",
            price: prices.AGKA?.toFixed(2),
            image: "https://www.vetawallet.com/_next/image?url=%2Fagk.png&w=48&q=75",
        },
        {
            value: "AUKA",
            label: "AUKA",
            price: prices.AUKA?.toFixed(2),
            image: "https://www.vetawallet.com/_next/image?url=%2Fauka.png&w=48&q=75",
        },
        {
            value: "ORIGEN",
            label: "ORIGEN",
            price: prices.ORIGEN?.toFixed(2),
            image: "https://www.vetawallet.com/origen.png",
        },
    ];
    const customSingleValue = ({ data }) => (
        <div className="flex items-center gap-2">
            <img src={data.image} alt={data.label} className="w-10 h-10" />
            <span>{data.label} - ${data.price} USDT</span>
        </div>
    );

    const customOption = (props) => {
        const { data, innerRef, innerProps } = props;
        return (
            <div
                ref={innerRef}
                {...innerProps}
                className="flex items-center gap-2 p-2 hover:bg-white/10 cursor-pointer"
            >
                <img src={data.image} alt={data.label} className="w-8 h-8" />
                <span>{data.label} - ${data.price} USDT</span>
            </div>
        );
    };

    return (
        <Select
            options={options}
            value={options.find((opt) => opt.value === selectedToken)}
            onChange={(option) => onChange({ target: { value: option.value } })}
            components={{ SingleValue: customSingleValue, Option: customOption }}
            // isSearchable={false}
            styles={{
                control: (base) => ({
                    ...base,
                    backgroundColor: "#16191C",
                    borderColor: "rgba(255,255,255,0.7)",
                    color: "white",
                    padding: "0",
                    fontSize: "1.1rem",
                    display: "flex", // Cambiar grid a flex
                }),
                menu: (base) => ({
                    ...base,
                    backgroundColor: "#16191C",
                    color: "white",
                }),
                singleValue: (base) => ({
                    ...base,
                    color: "white",
                }),
                input: (base) => ({
                    ...base,
                    color: "white", // Color del texto en el campo de búsqueda
                    fontSize: "1.1rem", // Tamaño de la fuente en el campo de búsqueda
                }),
            }}
        />
    );
};

export default TokenSelect;
